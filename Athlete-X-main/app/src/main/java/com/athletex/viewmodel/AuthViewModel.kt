package com.athletex.viewmodel

import androidx.lifecycle.MutableLiveData
import androidx.lifecycle.LiveData
import androidx.lifecycle.viewModelScope
import com.athletex.repository.AuthRepository
import kotlinx.coroutines.launch

class AuthViewModel : BaseViewModel() {
    
    private val repository = AuthRepository()
    
    private val _loginSuccess = MutableLiveData<Boolean>()
    val loginSuccess: LiveData<Boolean> = _loginSuccess
    
    private val _signupSuccess = MutableLiveData<Boolean>()
    val signupSuccess: LiveData<Boolean> = _signupSuccess
    
    fun loginWithEmail(email: String, password: String) {
        viewModelScope.launch {
            showLoading()
            repository.loginWithEmail(email, password)
                .onSuccess {
                    _loginSuccess.value = true
                    hideLoading()
                }
                .onFailure { exception ->
                    showError(exception.message ?: "Login failed")
                }
        }
    }
    
    fun signupWithEmail(email: String, password: String) {
        viewModelScope.launch {
            showLoading()
            repository.signupWithEmail(email, password)
                .onSuccess {
                    _signupSuccess.value = true
                    hideLoading()
                }
                .onFailure { exception ->
                    showError(exception.message ?: "Signup failed")
                }
        }
    }
    
    fun logout() {
        repository.logout()
    }
}
