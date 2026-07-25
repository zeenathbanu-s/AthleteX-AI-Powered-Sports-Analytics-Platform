package com.athletex.ui.auth

import android.content.Intent
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.ViewModelProvider
import com.athletex.databinding.ActivitySignupBinding
import com.athletex.ui.MainActivity
import com.athletex.utils.showToast
import com.athletex.utils.isValidEmail
import com.athletex.viewmodel.AuthViewModel

class SignupActivity : AppCompatActivity() {
    
    private lateinit var binding: ActivitySignupBinding
    private lateinit var viewModel: AuthViewModel
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivitySignupBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        viewModel = ViewModelProvider(this)[AuthViewModel::class.java]
        
        setupUI()
        observeViewModel()
    }
    
    private fun setupUI() {
        binding.btnSignup.setOnClickListener {
            val email = binding.etEmail.text.toString().trim()
            val password = binding.etPassword.text.toString().trim()
            val confirmPassword = binding.etConfirmPassword.text.toString().trim()
            
            if (validateInput(email, password, confirmPassword)) {
                viewModel.signupWithEmail(email, password)
            }
        }
        
        binding.btnBackToLogin.setOnClickListener {
            finish()
        }
    }
    
    private fun observeViewModel() {
        viewModel.isLoading.observe(this) { isLoading ->
            binding.btnSignup.isEnabled = !isLoading
        }
        
        viewModel.error.observe(this) { error ->
            if (!error.isNullOrEmpty()) {
                showToast(error)
            }
        }
        
        viewModel.signupSuccess.observe(this) { success ->
            if (success) {
                showToast("Account created successfully!")
                startActivity(Intent(this, MainActivity::class.java))
                finish()
            }
        }
    }
    
    private fun validateInput(email: String, password: String, confirmPassword: String): Boolean {
        return when {
            email.isEmpty() -> {
                showToast("Please enter email")
                false
            }
            !email.isValidEmail() -> {
                showToast("Please enter a valid email")
                false
            }
            password.isEmpty() -> {
                showToast("Please enter password")
                false
            }
            password.length < 6 -> {
                showToast("Password must be at least 6 characters")
                false
            }
            confirmPassword.isEmpty() -> {
                showToast("Please confirm password")
                false
            }
            password != confirmPassword -> {
                showToast("Passwords do not match")
                false
            }
            else -> true
        }
    }
}
