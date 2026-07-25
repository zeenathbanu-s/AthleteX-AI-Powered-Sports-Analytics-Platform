package com.athletex.ui.admin

import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import com.athletex.databinding.ActivityAdminDashboardBinding

class AdminDashboardActivity : AppCompatActivity() {
    
    private lateinit var binding: ActivityAdminDashboardBinding
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityAdminDashboardBinding.inflate(layoutInflater)
        setContentView(binding.root)
        
        // TODO: Implement admin dashboard functionality
    }
}
