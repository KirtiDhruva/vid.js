class VideoManager {
  constructor(container) {
    this.container = container
    this.video = document.createElement('video')
    this.video.controls = true
    this.container.appendChild(this.video)
    this.url = null
    this.isPlaying = false
  }

  toggleControls() {
    this.video.controls = !this.video.controls
  }

  toggleMute() {
    this.video.muted = !this.video.muted
    return this.video.muted
  }

  play(file) {
    this.url = URL.createObjectURL(file)
    this.video.src = this.url
    this.resume()
  }

  stop() {
    if (this.isPlaying) {
      this.video.src = ''
      this.video.currentTime = 0
    }
  }

  pause() {
    if (this.isPlaying) {
      this.video.pause()
      this.isPlaying = false
    }
  }

  resume() {
    this.video.play()
    this.isPlaying = true
  }

  seek() {}
}
