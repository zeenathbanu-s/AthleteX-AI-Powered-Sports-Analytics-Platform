package com.athletex.ui.training

import android.content.Intent
import android.os.Bundle
import android.view.Menu
import android.view.MenuItem
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.ViewModelProvider
import androidx.recyclerview.widget.LinearLayoutManager
import com.athletex.R
import com.athletex.databinding.ActivityTrainingBinding
import com.athletex.model.DifficultyLevel
import com.athletex.model.SportType
import com.athletex.model.TrainingProgram
import com.athletex.ui.adapter.TrainingProgramAdapter
import com.athletex.utils.showToast
import com.athletex.viewmodel.TrainingViewModel

class TrainingActivity : AppCompatActivity() {
    
    private lateinit var binding: ActivityTrainingBinding
    private lateinit var viewModel: TrainingViewModel
    private lateinit var adapter: TrainingProgramAdapter
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityTrainingBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        viewModel = ViewModelProvider(this)[TrainingViewModel::class.java]
        
        setupUI()
        setupRecyclerView()
        observeViewModel()
        viewModel.loadAllPrograms()
    }
    
    override fun onCreateOptionsMenu(menu: Menu?): Boolean {
        menuInflater.inflate(R.menu.menu_training, menu)
        return true
    }
    
    override fun onOptionsItemSelected(item: MenuItem): Boolean {
        return when (item.itemId) {
            android.R.id.home -> {
                finish()
                true
            }
            R.id.action_filter_sport -> {
                showSportFilterDialog()
                true
            }
            R.id.action_filter_difficulty -> {
                showDifficultyFilterDialog()
                true
            }
            R.id.action_reset_filters -> {
                viewModel.resetFilters()
                true
            }
            else -> super.onOptionsItemSelected(item)
        }
    }
    
    private fun setupUI() {
        setSupportActionBar(binding.toolbar)
        supportActionBar?.setDisplayHomeAsUpEnabled(true)
        supportActionBar?.title = "Training Programs"
    }
    
    private fun setupRecyclerView() {
        adapter = TrainingProgramAdapter { program ->
            openProgramDetails(program)
        }
        
        binding.recyclerViewPrograms.apply {
            layoutManager = LinearLayoutManager(this@TrainingActivity)
            adapter = this@TrainingActivity.adapter
        }
    }
    
    private fun observeViewModel() {
        viewModel.isLoading.observe(this) { isLoading ->
            // Handle loading state if needed
        }
        
        viewModel.error.observe(this) { error ->
            if (!error.isNullOrEmpty()) {
                showToast(error)
            }
        }
        
        viewModel.programs.observe(this) { programs ->
            adapter.submitList(programs)
            
            if (programs.isEmpty()) {
                showToast("No programs found")
            }
        }
    }
    
    private fun openProgramDetails(program: TrainingProgram) {
        val intent = Intent(this, TrainingDetailActivity::class.java)
        intent.putExtra("program", program)
        startActivity(intent)
    }
    
    private fun showSportFilterDialog() {
        val sports = SportType.values().map { it.name.replace("_", " ") }.toTypedArray()
        
        AlertDialog.Builder(this)
            .setTitle("Filter by Sport")
            .setItems(sports) { _, which ->
                val selectedSport = SportType.values()[which]
                viewModel.filterProgramsBySport(selectedSport)
            }
            .setNegativeButton("Cancel", null)
            .show()
    }
    
    private fun showDifficultyFilterDialog() {
        val difficulties = DifficultyLevel.values().map { it.name }.toTypedArray()
        
        AlertDialog.Builder(this)
            .setTitle("Filter by Difficulty")
            .setItems(difficulties) { _, which ->
                val selectedDifficulty = DifficultyLevel.values()[which]
                viewModel.filterProgramsByDifficulty(selectedDifficulty)
            }
            .setNegativeButton("Cancel", null)
            .show()
    }
}
