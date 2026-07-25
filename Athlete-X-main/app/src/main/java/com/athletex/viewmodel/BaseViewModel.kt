package com.athletex.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.LiveData
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlin.coroutines.CoroutineContext

abstract class BaseViewModel : ViewModel(), CoroutineScope {
    
    private val job = SupervisorJob()
    
    override val coroutineContext: CoroutineContext
        get() = Dispatchers.Main + job
    
    protected val _isLoading = MutableLiveData<Boolean>()
    val isLoading: LiveData<Boolean> = _isLoading
    
    protected val _error = MutableLiveData<String>()
    val error: LiveData<String> = _error
    
    protected val _success = MutableLiveData<String>()
    val success: LiveData<String> = _success
    
    override fun onCleared() {
        super.onCleared()
        job.cancel()
    }
    
    protected fun showLoading() {
        _isLoading.value = true
    }
    
    protected fun hideLoading() {
        _isLoading.value = false
    }
    
    protected fun showError(message: String) {
        _error.value = message
        hideLoading()
    }
    
    protected fun showSuccess(message: String) {
        _success.value = message
        hideLoading()
    }
}
