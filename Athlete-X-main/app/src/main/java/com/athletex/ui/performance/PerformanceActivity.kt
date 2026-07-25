package com.athletex.ui.performance

import android.os.Bundle
import android.view.Menu
import android.view.MenuItem
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.ViewModelProvider
import com.athletex.R
import com.athletex.databinding.ActivityPerformanceBinding
import com.athletex.model.MetricType
import com.athletex.model.PerformanceMetric
import com.athletex.utils.showToast
import com.athletex.viewmodel.PerformanceViewModel
import com.github.mikephil.charting.charts.BarChart
import com.github.mikephil.charting.data.*
import com.github.mikephil.charting.formatter.IndexAxisValueFormatter
import com.google.firebase.auth.FirebaseAuth
import java.text.SimpleDateFormat
import java.util.*

class PerformanceActivity : AppCompatActivity() {
    
    private lateinit var binding: ActivityPerformanceBinding
    private lateinit var viewModel: PerformanceViewModel
    private val dateFormat = SimpleDateFormat("MMM dd", Locale.getDefault())
    private var isLineChart = true
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityPerformanceBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        viewModel = ViewModelProvider(this)[PerformanceViewModel::class.java]
        
        setupUI()
        observeViewModel()
        loadData()
    }
    
    override fun onCreateOptionsMenu(menu: Menu?): Boolean {
        menuInflater.inflate(R.menu.menu_performance, menu)
        return true
    }
    
    override fun onOptionsItemSelected(item: MenuItem): Boolean {
        return when (item.itemId) {
            android.R.id.home -> {
                finish()
                true
            }
            R.id.action_add_metric -> {
                showAddMetricDialog()
                true
            }
            R.id.action_toggle_chart -> {
                isLineChart = !isLineChart
                viewModel.metrics.value?.let { updateChart(it) }
                true
            }
            R.id.action_analytics -> {
                showAnalyticsDialog()
                true
            }
            else -> super.onOptionsItemSelected(item)
        }
    }
    
    private fun setupUI() {
        setSupportActionBar(binding.toolbar)
        supportActionBar?.setDisplayHomeAsUpEnabled(true)
        supportActionBar?.title = "Performance Tracking"
        
        setupChart()
    }
    
    private fun setupChart() {
        binding.performanceChart.description.isEnabled = false
        binding.performanceChart.setTouchEnabled(true)
        binding.performanceChart.setDragEnabled(true)
        binding.performanceChart.setScaleEnabled(true)
        binding.performanceChart.setPinchZoom(true)
        
        binding.barChart.description.isEnabled = false
        binding.barChart.setTouchEnabled(true)
        binding.barChart.setDragEnabled(true)
        binding.barChart.setScaleEnabled(true)
        binding.barChart.setPinchZoom(true)
    }
    
    private fun observeViewModel() {
        viewModel.isLoading.observe(this) { isLoading ->
            // Handle loading state
        }
        
        viewModel.error.observe(this) { error ->
            if (!error.isNullOrEmpty()) {
                showToast(error)
            }
        }
        
        viewModel.success.observe(this) { success ->
            if (!success.isNullOrEmpty()) {
                showToast(success)
            }
        }
        
        viewModel.metrics.observe(this) { metrics ->
            updateChart(metrics)
        }
    }
    
    private fun loadData() {
        FirebaseAuth.getInstance().currentUser?.uid?.let { userId ->
            viewModel.loadMetrics(userId)
        }
    }
    
    private fun updateChart(metrics: List<PerformanceMetric>) {
        if (metrics.isEmpty()) {
            binding.performanceChart.clear()
            binding.barChart.clear()
            return
        }
        
        if (isLineChart) {
            binding.performanceChart.visibility = View.VISIBLE
            binding.barChart.visibility = View.GONE
            updateLineChart(metrics)
        } else {
            binding.performanceChart.visibility = View.GONE
            binding.barChart.visibility = View.VISIBLE
            updateBarChart(metrics)
        }
    }
    
    private fun updateLineChart(metrics: List<PerformanceMetric>) {
        val metricsByType = metrics.groupBy { it.metricType }
        val dataSets = mutableListOf<LineDataSet>()
        
        metricsByType.entries.forEachIndexed { index, (metricType, typeMetrics) ->
            val entries = typeMetrics.mapIndexed { i, metric ->
                Entry(i.toFloat(), metric.value.toFloat())
            }
            
            val dataSet = LineDataSet(entries, getMetricTitle(metricType))
            dataSet.color = getColorForMetricType(index)
            dataSet.setCircleColor(getColorForMetricType(index))
            dataSet.lineWidth = 2f
            dataSet.circleRadius = 3f
            dataSet.setDrawFilled(true)
            dataSet.fillAlpha = 60
            dataSets.add(dataSet)
        }
        
        val lineData = LineData(dataSets as List<LineDataSet>?)
        binding.performanceChart.data = lineData
        binding.performanceChart.invalidate()
    }
    
    private fun updateBarChart(metrics: List<PerformanceMetric>) {
        val metricsByType = metrics.groupBy { it.metricType }
        val barEntries = mutableListOf<BarEntry>()
        val labels = mutableListOf<String>()
        
        metricsByType.entries.forEachIndexed { index, (metricType, typeMetrics) ->
            val averageValue = typeMetrics.map { it.value }.average().toFloat()
            barEntries.add(BarEntry(index.toFloat(), averageValue))
            labels.add(getMetricTitle(metricType))
        }
        
        val barDataSet = BarDataSet(barEntries, "Average Performance")
        barDataSet.colors = metricsByType.keys.mapIndexed { index, _ ->
            getColorForMetricType(index)
        }
        
        val barData = BarData(barDataSet)
        binding.barChart.data = barData
        binding.barChart.xAxis.valueFormatter = IndexAxisValueFormatter(labels)
        binding.barChart.xAxis.granularity = 1f
        binding.barChart.invalidate()
    }
    
    private fun getMetricTitle(metricType: MetricType): String {
        return when (metricType) {
            MetricType.TIMING_100M -> "100m Sprint"
            MetricType.TIMING_200M -> "200m Sprint"
            MetricType.TIMING_800M -> "800m Run"
            MetricType.LONG_JUMP -> "Long Jump"
            MetricType.SHOT_PUT_DISTANCE -> "Shot Put"
        }
    }
    
    private fun getColorForMetricType(index: Int): Int {
        val colors = intArrayOf(
            android.graphics.Color.RED,
            android.graphics.Color.BLUE,
            android.graphics.Color.GREEN,
            android.graphics.Color.MAGENTA,
            android.graphics.Color.CYAN
        )
        return colors[index % colors.size]
    }
    
    private fun showAddMetricDialog() {
        val metricTypes = MetricType.values().map { getMetricTitle(it) }.toTypedArray()
        
        AlertDialog.Builder(this)
            .setTitle("Add Performance Metric")
            .setItems(metricTypes) { _, which ->
                val selectedType = MetricType.values()[which]
                showValueInputDialog(selectedType)
            }
            .show()
    }
    
    private fun showValueInputDialog(metricType: MetricType) {
        val input = android.widget.EditText(this)
        input.hint = "Enter value"
        input.inputType = android.text.InputType.TYPE_CLASS_NUMBER or android.text.InputType.TYPE_NUMBER_FLAG_DECIMAL
        
        AlertDialog.Builder(this)
            .setTitle("Add ${getMetricTitle(metricType)}")
            .setMessage("Enter your performance value:")
            .setView(input)
            .setPositiveButton("Add") { _, _ ->
                val value = input.text.toString().toDoubleOrNull()
                if (value != null && value > 0) {
                    viewModel.addMetric(metricType, value)
                } else {
                    showToast("Please enter a valid value")
                }
            }
            .setNegativeButton("Cancel", null)
            .show()
    }
    
    private fun showAnalyticsDialog() {
        val metrics = viewModel.metrics.value ?: return
        if (metrics.isEmpty()) {
            showToast("No data available for analytics")
            return
        }
        
        val analytics = generateAnalytics(metrics)
        
        AlertDialog.Builder(this)
            .setTitle("Performance Analytics")
            .setMessage(analytics)
            .setPositiveButton("OK", null)
            .show()
    }
    
    private fun generateAnalytics(metrics: List<PerformanceMetric>): String {
        val metricsByType = metrics.groupBy { it.metricType }
        val analytics = StringBuilder()
        
        analytics.append("📊 Performance Summary\n\n")
        analytics.append("Total Metrics Recorded: ${metrics.size}\n")
        analytics.append("Metric Types: ${metricsByType.size}\n\n")
        
        metricsByType.forEach { (type, typeMetrics) ->
            val values = typeMetrics.map { it.value }
            val average = values.average()
            val best = if (isTimingMetric(type)) values.minOrNull() else values.maxOrNull()
            val improvement = calculateImprovement(values)
            
            analytics.append("🏃 ${getMetricTitle(type)}:\n")
            analytics.append("  • Records: ${typeMetrics.size}\n")
            analytics.append("  • Average: ${String.format("%.2f", average)}\n")
            analytics.append("  • Best: ${String.format("%.2f", best ?: 0.0)}\n")
            analytics.append("  • Trend: ${if (improvement > 0) "Improving ↗️" else if (improvement < 0) "Declining ↘️" else "Stable →"}\n\n")
        }
        
        return analytics.toString()
    }
    
    private fun isTimingMetric(metricType: MetricType): Boolean {
        return when (metricType) {
            MetricType.TIMING_100M, MetricType.TIMING_200M, MetricType.TIMING_800M -> true
            else -> false
        }
    }
    
    private fun calculateImprovement(values: List<Double>): Double {
        if (values.size < 2) return 0.0
        val firstHalf = values.take(values.size / 2)
        val secondHalf = values.drop(values.size / 2)
        return secondHalf.average() - firstHalf.average()
    }
}
