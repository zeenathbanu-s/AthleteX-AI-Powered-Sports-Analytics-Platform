package com.athletex.viewmodel

import android.net.Uri
import androidx.lifecycle.LiveData
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.viewModelScope
import com.athletex.model.AssessmentTest
import com.athletex.model.TestType
import com.athletex.repository.AssessmentRepository
import kotlinx.coroutines.launch

class AssessmentViewModel : BaseViewModel() {
    private val repository = AssessmentRepository()

    private val _tests = MutableLiveData<List<AssessmentTest>>()
    val tests: LiveData<List<AssessmentTest>> = _tests

    private val _videoUrl = MutableLiveData<String>()
    val videoUrl: LiveData<String> = _videoUrl

    private val _testSaved = MutableLiveData<Boolean>()
    val testSaved: LiveData<Boolean> = _testSaved

    fun loadMyTests(athleteId: String) {
        viewModelScope.launch {
            showLoading()
            repository.getAthleteTests(athleteId)
                .onSuccess { list ->
                    _tests.value = list
                    hideLoading()
                }
                .onFailure { e -> showError(e.message ?: "Failed to load tests") }
        }
    }

    fun saveTest(testType: TestType, notes: String, videoUri: Uri?) {
        viewModelScope.launch {
            showLoading()
            val dummyScore = repository.generateDummyScore(testType)
            val test = AssessmentTest(testType = testType, score = dummyScore, notes = notes)
            repository.saveAssessmentTest(test)
                .onSuccess { testId ->
                    if (videoUri != null) {
                        repository.uploadTestVideo(videoUri, testId)
                            .onSuccess { url ->
                                _videoUrl.value = url
                                repository.updateTestVideoUrl(testId, url)
                            }
                            .onFailure { e -> showError(e.message ?: "Failed to upload video") }
                    }
                    _testSaved.value = true
                    showSuccess("Test saved")
                }
                .onFailure { e -> showError(e.message ?: "Failed to save test") }
        }
    }
}
