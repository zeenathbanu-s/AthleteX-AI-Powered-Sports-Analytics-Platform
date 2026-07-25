package com.athletex.viewmodel

import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.viewModelScope
import com.athletex.model.DifficultyLevel
import com.athletex.model.SportType
import com.athletex.model.TrainingProgram
import com.athletex.repository.TrainingRepository
import kotlinx.coroutines.launch

class TrainingViewModel : BaseViewModel() {
    private val repository = TrainingRepository()
    
    private val _programs = MutableLiveData<List<TrainingProgram>>()
    val programs: LiveData<List<TrainingProgram>> = _programs
    
    private val _selectedProgram = MutableLiveData<TrainingProgram>()
    val selectedProgram: LiveData<TrainingProgram> = _selectedProgram
    
    fun loadAllPrograms() {
        viewModelScope.launch {
            showLoading()
            try {
                val programList = repository.getTrainingPrograms()
                _programs.value = programList
                hideLoading()
            } catch (e: Exception) {
                showError(e.message ?: "Failed to load programs")
            }
        }
    }
    
    fun filterProgramsBySport(sport: SportType) {
        viewModelScope.launch {
            showLoading()
            try {
                val filteredPrograms = repository.getProgramsBySport(sport)
                _programs.value = filteredPrograms
                hideLoading()
            } catch (e: Exception) {
                showError(e.message ?: "Failed to filter programs")
            }
        }
    }
    
    fun filterProgramsByDifficulty(difficulty: DifficultyLevel) {
        viewModelScope.launch {
            showLoading()
            try {
                val filteredPrograms = repository.getProgramsByDifficulty(difficulty)
                _programs.value = filteredPrograms
                hideLoading()
            } catch (e: Exception) {
                showError(e.message ?: "Failed to filter programs")
            }
        }
    }
    
    fun selectProgram(program: TrainingProgram) {
        _selectedProgram.value = program
    }
    
    fun resetFilters() {
        loadAllPrograms()
    }
}
