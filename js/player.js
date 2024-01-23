class Player {
  constructor(containerId, width = '100vw', height = '100vh') {
    this.container = document.getElementById(containerId)
    this.container.classList.add('player')
    this.container.style.width = width
    this.container.style.height = height

    this.rightPanel = document.createElement('div')
    this.rightPanel.classList.add('video-manager')
    this.container.appendChild(this.rightPanel)

    this.leftPanel = document.createElement('div')
    this.leftPanel.classList.add('playlist-manager')
    this.container.appendChild(this.leftPanel)

    this.videoManager = new VideoManager(this.rightPanel)
    this.playlistManager = new PlaylistManager(
      this.leftPanel,
      this.videoManager,
      []
    )
  }

  play() {
    let file = this.playlistManager.getNext()
    if (!file) return
    this.videoManager.play(file)
  }
}
