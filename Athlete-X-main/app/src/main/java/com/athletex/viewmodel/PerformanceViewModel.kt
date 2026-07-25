package com.athletex.viewmodel

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.viewModelScope
import com.athletex.model.MetricType
import com.athletex.model.PerformanceMetric
import com.athletex.repository.PerformanceRepository
import kotlinx.coroutines.launch
import java.util.*

class PerformanceViewModel : BaseViewModel() {
    private val repository = PerformanceRepository()

    private val _metrics = MutableLiveData<List<PerformanceMetric>>()
    val metrics: LiveData<List<PerformanceMetric>> = _metrics

    fun loadMetrics(athleteId: String) {
        viewModelScope.launch {
            showLoading()
            repository.getAthleteMetrics(athleteId)
                .onSuccess { list ->
                    _metrics.value = list
                    hideLoading()
                }
                .onFailure { e -> showError(e.message ?: "Failed to load metrics") }
        }
    }

    fun addMetric(metricType: MetricType, value: Double, unit: String? = null, notes: String = "") {
        viewModelScope.launch {
            showLoading()
            val metric = PerformanceMetric(
                metricType = metricType,
                value = value,
                unit = unit ?: repository.getMetricUnit(metricType),
                timestamp = Date(),
                notes = notes
            )
            repository.savePerformanceMetric(metric)
                .onSuccess {
                    showSuccess("Metric saved")
                    // Reload metrics
                    repository.getCurrentUserId()?.let { id -> loadMetrics(id) }
                }
                .onFailure { e -> showError(e.message ?: "Failed to save metric") }
        }
    }
}

