package com.athletex.ui.training

import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.LinearLayoutManager
import com.athletex.databinding.ActivityTrainingDetailBinding
import com.athletex.model.Exercise
import com.athletex.model.TrainingProgram
import com.athletex.ui.adapter.ExerciseAdapter

class TrainingDetailActivity : AppCompatActivity() {
    
    private lateinit var binding: ActivityTrainingDetailBinding
    private lateinit var exerciseAdapter: ExerciseAdapter
    private var trainingProgram: TrainingProgram? = null
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityTrainingDetailBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        trainingProgram = intent.getParcelableExtra("program")
        
        setupUI()
        setupRecyclerView()
        displayProgramDetails()
    }
    
    private fun setupUI() {
        setSupportActionBar(binding.toolbar)
        supportActionBar?.setDisplayHomeAsUpEnabled(true)
        supportActionBar?.title = trainingProgram?.title ?: "Training Program"
    }
    
    private fun setupRecyclerView() {
        exerciseAdapter = ExerciseAdapter()
        binding.recyclerViewExercises.apply {
            layoutManager = LinearLayoutManager(this@TrainingDetailActivity)
            adapter = exerciseAdapter
        }
    }
    
    private fun displayProgramDetails() {
        trainingProgram?.let { program ->
            binding.apply {
                tvProgramTitle.text = program.title
                tvProgramDescription.text = program.description
                tvProgramSport.text = "Sport: ${program.sport.name.replace("_", " ")}"
                tvProgramDuration.text = "Duration: ${program.duration}"
                tvProgramDifficulty.text = "Difficulty: ${program.difficulty.name}"
                
                exerciseAdapter.submitList(program.exercises)
            }
        }
    }
    
    override fun onSupportNavigateUp(): Boolean {
        finish()
        return true
    }
}
