package com.athletex.ui.auth

import android.content.Intent
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.ViewModelProvider
import com.athletex.R
import com.athletex.databinding.ActivityLoginBinding
import com.athletex.ui.MainActivity
import com.athletex.utils.showToast
import com.athletex.viewmodel.AuthViewModel

class LoginActivity : AppCompatActivity() {
    
    private lateinit var binding: ActivityLoginBinding
    private lateinit var viewModel: AuthViewModel
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityLoginBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        viewModel = ViewModelProvider(this)[AuthViewModel::class.java]
        
        setupUI()
        observeViewModel()
    }
    
    private fun setupUI() {
        binding.btnLogin.setOnClickListener {
            val email = binding.etEmail.text.toString().trim()
            val password = binding.etPassword.text.toString().trim()
            
            if (validateInput(email, password)) {
                viewModel.loginWithEmail(email, password)
            }
        }
        
        binding.btnSignup.setOnClickListener {
            startActivity(Intent(this, SignupActivity::class.java))
        }
        
        binding.btnPhoneLogin.setOnClickListener {
            // TODO: Implement phone login
            showToast("Phone login coming soon!")
        }
    }
    
    private fun observeViewModel() {
        viewModel.isLoading.observe(this) { isLoading ->
            binding.btnLogin.isEnabled = !isLoading
        }
        
        viewModel.error.observe(this) { error ->
            if (!error.isNullOrEmpty()) {
                showToast(error)
            }
        }
        
        viewModel.loginSuccess.observe(this) { success ->
            if (success) {
                startActivity(Intent(this, MainActivity::class.java))
                finish()
            }
        }
    }
    
    private fun validateInput(email: String, password: String): Boolean {
        return when {
            email.isEmpty() -> {
                showToast("Please enter email")
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
            else -> true
        }
    }
}
