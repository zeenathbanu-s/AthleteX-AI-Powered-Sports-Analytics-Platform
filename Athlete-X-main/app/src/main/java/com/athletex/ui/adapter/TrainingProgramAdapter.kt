package com.athletex.ui.adapter

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.athletex.databinding.ItemTrainingProgramBinding
import com.athletex.model.DifficultyLevel
import com.athletex.model.TrainingProgram

class TrainingProgramAdapter(
    private val onProgramClick: (TrainingProgram) -> Unit
) : ListAdapter<TrainingProgram, TrainingProgramAdapter.TrainingProgramViewHolder>(DiffCallback()) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): TrainingProgramViewHolder {
        val binding = ItemTrainingProgramBinding.inflate(
            LayoutInflater.from(parent.context), parent, false
        )
        return TrainingProgramViewHolder(binding)
    }

    override fun onBindViewHolder(holder: TrainingProgramViewHolder, position: Int) {
        holder.bind(getItem(position))
    }

    inner class TrainingProgramViewHolder(
        private val binding: ItemTrainingProgramBinding
    ) : RecyclerView.ViewHolder(binding.root) {

        fun bind(program: TrainingProgram) {
            binding.apply {
                tvTitle.text = program.title
                tvDescription.text = program.description
                tvSport.text = program.sport.name.replace("_", " ")
                tvDuration.text = program.duration
                tvDifficulty.text = program.difficulty.name
                tvExerciseCount.text = "${program.exercises.size} exercises"
                
                // Set difficulty color
                val difficultyColor = when (program.difficulty) {
                    DifficultyLevel.BEGINNER -> android.graphics.Color.GREEN
                    DifficultyLevel.INTERMEDIATE -> android.graphics.Color.parseColor("#FFA500") // Orange
                    DifficultyLevel.ADVANCED -> android.graphics.Color.RED
                }
                tvDifficulty.setTextColor(difficultyColor)
                
                root.setOnClickListener { onProgramClick(program) }
            }
        }
    }

    private class DiffCallback : DiffUtil.ItemCallback<TrainingProgram>() {
        override fun areItemsTheSame(oldItem: TrainingProgram, newItem: TrainingProgram): Boolean {
            return oldItem.id == newItem.id
        }

        override fun areContentsTheSame(oldItem: TrainingProgram, newItem: TrainingProgram): Boolean {
            return oldItem == newItem
        }
    }
}
