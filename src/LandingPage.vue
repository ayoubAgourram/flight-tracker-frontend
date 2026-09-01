<template>
  <div class="landing-container">
    <div class="landing-content">
      <div class="landing-header">
        <h1 class="landing-title">Flight Tracker</h1>
        <p class="landing-subtitle">Real-time Aircraft Monitoring</p>
      </div>
      
      <div class="landing-icon-wrapper">
        <div class="wave wave-1"></div>
        <div class="wave wave-2"></div>
        <div class="wave wave-3"></div>
        <button class="landing-icon-btn" @click="$emit('start')" aria-label="Start Flight Tracking">
          <img src="./tails/infoAircraft.png" alt="Flight Tracker" class="landing-icon" />
        </button>
      </div>

      <div class="landing-description">
        <p>Track live aircraft positions on an interactive map. View detailed flight information, seat maps, and route trajectories in real-time.</p>
      </div>

      <div class="landing-features">
        <div class="feature">
          <img src="./tails/tracking.png" alt="Live Tracking" class="feature-icon" />
          <span class="feature-text">Live Tracking</span>
        </div>
        <div class="feature">
          <img src="./tails/flight-time.png" alt="Flight Details" class="feature-icon" />
          <span class="feature-text">Flight Details</span>
        </div>
        <div class="feature">
          <img src="./tails/route.png" alt="Route Visualization" class="feature-icon" />
          <span class="feature-text">Route Visualization</span>
        </div>
      </div>

      <div class="landing-cta">
        <button class="cta-button" @click="$emit('plan-route')">
          Plan an Air Transat route
          <span class="arrow">→</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
// Component simply emits 'start' event when user clicks
</script>

<style scoped>
.landing-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  color: white;
  overflow: hidden;
}

.landing-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  max-width: 600px;
  text-align: center;
  animation: fadeIn 0.6s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes wave {
  0% {
    width: 200px;
    height: 200px;
    opacity: 0.8;
    transform: translate(-50%, -50%);
  }
  100% {
    width: 400px;
    height: 400px;
    opacity: 0;
    transform: translate(-50%, -50%);
  }
}

.landing-header {
  margin-bottom: 60px;
}

.landing-title {
  font-size: 3.5rem;
  font-weight: 800;
  margin: 0;
  letter-spacing: -2px;
  text-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.landing-subtitle {
  font-size: 1.2rem;
  margin: 12px 0 0 0;
  opacity: 0.9;
  font-weight: 300;
  letter-spacing: 1px;
}

.landing-icon-wrapper {
  margin-bottom: 50px;
  perspective: 1000px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 200px;
  height: 200px;
  margin-left: auto;
  margin-right: auto;
}

.wave {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 200px;
  height: 200px;
  border: 2px solid rgba(255, 255, 255, 0.6);
  border-radius: 50%;
  animation: wave 2s ease-out infinite;
  pointer-events: none;
}

.wave-1 {
  animation-delay: 0s;
}

.wave-2 {
  animation-delay: 0.6s;
}

.wave-3 {
  animation-delay: 1.2s;
}

.landing-icon-btn {
  border: none;
  background: none;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 200px;
  height: 200px;
  position: relative;
  z-index: 1;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 255, 255, 0.3);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.2);
}

.landing-icon-btn:hover {
  background: rgba(255, 255, 255, 0.25);
  border-color: rgba(255, 255, 255, 0.5);
  transform: scale(1.05) translateY(-5px);
  box-shadow: 0 30px 70px rgba(0, 0, 0, 0.3);
}

.landing-icon-btn:active {
  transform: scale(0.98);
}

.landing-icon {
  width: 120px;
  height: 120px;
  object-fit: contain;
  filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.15));
}

.landing-description {
  margin-bottom: 50px;
  font-size: 1.1rem;
  line-height: 1.6;
  opacity: 0.95;
  max-width: 500px;
}

.landing-features {
  display: flex;
  justify-content: center;
  gap: 40px;
  margin-bottom: 60px;
  flex-wrap: wrap;
}

.feature {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  opacity: 0.9;
}

.feature-icon {
  width: 48px;
  height: 48px;
  display: block;
  object-fit: contain;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
  background: rgba(255, 255, 255, 1);
  border-radius: 50%;
  padding: 12px;
  backdrop-filter: blur(5px);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.feature-text {
  font-size: 0.95rem;
  font-weight: 500;
  letter-spacing: 0.5px;
}

.landing-cta {
  display: flex;
  gap: 16px;
  justify-content: center;
}

.cta-button {
  background: rgba(255, 255, 255, 0.25);
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.4);
  padding: 14px 32px;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 50px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  letter-spacing: 0.5px;
  backdrop-filter: blur(10px);
}

.cta-button:hover {
  background: rgba(255, 255, 255, 0.35);
  border-color: rgba(255, 255, 255, 0.6);
  transform: translateY(-2px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.cta-button:active {
  transform: translateY(0);
}

.arrow {
  transition: transform 0.3s ease;
}

.cta-button:hover .arrow {
  transform: translateX(4px);
}

@media (max-width: 768px) {
  .landing-container {
    height: 100dvh;
    align-items: flex-start;
    overflow-y: auto;
    overscroll-behavior-y: contain;
    -webkit-overflow-scrolling: touch;
  }

  .landing-title {
    font-size: 2.5rem;
  }

  .landing-subtitle {
    font-size: 1rem;
  }

  .landing-content {
    padding: 20px;
    min-height: min-content;
  }

  .landing-icon-wrapper {
    margin-bottom: 40px;
    width: 160px;
    height: 160px;
  }

  .wave {
    width: 160px;
    height: 160px;
  }

  .landing-icon-btn {
    width: 160px;
    height: 160px;
  }

  .landing-icon {
    width: 100px;
    height: 100px;
  }

  .landing-header {
    margin-bottom: 40px;
  }

  .landing-features {
    gap: 30px;
    margin-bottom: 40px;
  }

  .feature-icon {
    width: 40px;
    height: 40px;
    padding: 10px;
  }
}

@media (max-width: 480px) {
  .landing-title {
    font-size: 2rem;
  }

  .landing-description {
    font-size: 1rem;
  }

  .landing-features {
    flex-direction: column;
    gap: 20px;
  }
}
</style>
