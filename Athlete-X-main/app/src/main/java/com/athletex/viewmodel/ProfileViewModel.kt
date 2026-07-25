package com.athletex.viewmodel

import android.net.Uri
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.viewModelScope
import com.athletex.model.Athlete
import com.athletex.repository.ProfileRepository
import kotlinx.coroutines.launch

class ProfileViewModel : BaseViewModel() {
    
    private val repository = ProfileRepository()
    
    private val _athlete = MutableLiveData<Athlete>()
    val athlete: LiveData<Athlete> = _athlete
    
    private val _profileSaved = MutableLiveData<Boolean>()
    val profileSaved: LiveData<Boolean> = _profileSaved
    
    private val _profilePictureUrl = MutableLiveData<String>()
    val profilePictureUrl: LiveData<String> = _profilePictureUrl
    
    private val _athletes = MutableLiveData<List<Athlete>>()
    val athletes: LiveData<List<Athlete>> = _athletes
    
    fun loadAthleteProfile() {
        viewModelScope.launch {
            showLoading()
            repository.getAthleteProfile()
                .onSuccess { athlete ->
                    if (athlete != null) {
                        _athlete.value = athlete
                    }
                    hideLoading()
                }
                .onFailure { exception ->
                    showError(exception.message ?: "Failed to load profile")
                }
        }
    }
    
    fun saveAthleteProfile(athlete: Athlete) {
        viewModelScope.launch {
            showLoading()
            repository.saveAthleteProfile(athlete)
                .onSuccess {
                    _athlete.value = athlete
                    _profileSaved.value = true
                    showSuccess("Profile saved successfully")
                }
                .onFailure { exception ->
                    showError(exception.message ?: "Failed to save profile")
                }
        }
    }
    
    fun uploadProfilePicture(imageUri: Uri) {
        viewModelScope.launch {
            showLoading()
            repository.uploadProfilePicture(imageUri)
                .onSuccess { downloadUrl ->
                    _profilePictureUrl.value = downloadUrl
                    updateProfilePictureUrl(downloadUrl)
                }
                .onFailure { exception ->
                    showError(exception.message ?: "Failed to upload profile picture")
                }
        }
    }
    
    private fun updateProfilePictureUrl(url: String) {
        viewModelScope.launch {
            repository.updateProfilePicture(url)
                .onSuccess {
                    // Update the current athlete object
                    _athlete.value = _athlete.value?.copy(profilePictureUrl = url)
                    showSuccess("Profile picture updated")
                }
                .onFailure { exception ->
                    showError(exception.message ?: "Failed to update profile picture")
                }
        }
    }
    
    fun loadAllAthletes() {
        viewModelScope.launch {
            showLoading()
            repository.getAllAthletes()
                .onSuccess { athletesList ->
                    _athletes.value = athletesList
                    hideLoading()
                }
                .onFailure { exception ->
                    showError(exception.message ?: "Failed to load athletes")
                }
        }
    }
    
    fun loadAthletesByFilters(
        sport: String? = null,
        country: String? = null,
        minAge: Int? = null,
        maxAge: Int? = null
    ) {
        viewModelScope.launch {
            showLoading()
            repository.getAthletesByFilters(sport, country, minAge, maxAge)
                .onSuccess { athletesList ->
                    _athletes.value = athletesList
                    hideLoading()
                }
                .onFailure { exception ->
                    showError(exception.message ?: "Failed to load filtered athletes")
                }
        }
    }
}
