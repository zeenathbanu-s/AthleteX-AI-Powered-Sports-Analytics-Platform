package com.athletex.ui.adapter

import android.animation.ObjectAnimator
import android.view.LayoutInflater
import android.view.ViewGroup
import android.view.animation.DecelerateInterpolator
import androidx.recyclerview.widget.RecyclerView
import com.athletex.databinding.ItemMainMenuBinding
import com.athletex.ui.model.MenuItem

class MainMenuAdapter(
    private val menuItems: List<MenuItem>,
    private val onItemClick: (MenuItem) -> Unit
) : RecyclerView.Adapter<MainMenuAdapter.MenuViewHolder>() {

    inner class MenuViewHolder(private val binding: ItemMainMenuBinding) : 
        RecyclerView.ViewHolder(binding.root) {
        
        fun bind(menuItem: MenuItem) {
            binding.menuTitle.text = menuItem.title
            binding.menuDescription.text = menuItem.description
            binding.menuIcon.setImageResource(menuItem.iconRes)
            
            // Add entrance animation
            binding.root.alpha = 0f
            binding.root.translationY = 100f
            
            ObjectAnimator.ofFloat(binding.root, "alpha", 0f, 1f).apply {
                duration = 300
                startDelay = (adapterPosition * 100).toLong()
                interpolator = DecelerateInterpolator()
                start()
            }
            
            ObjectAnimator.ofFloat(binding.root, "translationY", 100f, 0f).apply {
                duration = 300
                startDelay = (adapterPosition * 100).toLong()
                interpolator = DecelerateInterpolator()
                start()
            }
            
            binding.root.setOnClickListener {
                // Add click animation
                val scaleDown = ObjectAnimator.ofFloat(binding.root, "scaleX", 1f, 0.95f)
                val scaleDownY = ObjectAnimator.ofFloat(binding.root, "scaleY", 1f, 0.95f)
                val scaleUp = ObjectAnimator.ofFloat(binding.root, "scaleX", 0.95f, 1f)
                val scaleUpY = ObjectAnimator.ofFloat(binding.root, "scaleY", 0.95f, 1f)
                
                scaleDown.duration = 100
                scaleDownY.duration = 100
                scaleUp.duration = 100
                scaleUpY.duration = 100
                
                scaleDown.start()
                scaleDownY.start()
                
                scaleDown.addListener(object : android.animation.Animator.AnimatorListener {
                    override fun onAnimationStart(animation: android.animation.Animator) {}
                    override fun onAnimationEnd(animation: android.animation.Animator) {
                        scaleUp.start()
                        scaleUpY.start()
                        onItemClick(menuItem)
                    }
                    override fun onAnimationCancel(animation: android.animation.Animator) {}
                    override fun onAnimationRepeat(animation: android.animation.Animator) {}
                })
            }
        }
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): MenuViewHolder {
        val binding = ItemMainMenuBinding.inflate(
            LayoutInflater.from(parent.context), 
            parent, 
            false
        )
        return MenuViewHolder(binding)
    }

    override fun onBindViewHolder(holder: MenuViewHolder, position: Int) {
        holder.bind(menuItems[position])
    }

    override fun getItemCount(): Int = menuItems.size
}
