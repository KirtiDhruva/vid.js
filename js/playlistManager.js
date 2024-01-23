const matchExtension = (filename, allowedExtensions) => {
  const ext = '.' + filename.split('.').pop()
  return allowedExtensions.includes(ext)
}

const getCleanFilename = (filename) => {
  let tmp = filename.split('.')
  ext = tmp.pop()

  return tmp.join(' ') + '.' + ext
}

const getCleanFileSize = (size) => {
  const temp = [
    { size: size / 1024 / 1024 / 1024, unit: 'GB' },
    { size: size / 1024 / 1024, unit: 'MB' },
    { size: size / 1024, unit: 'KB' },
    { size: size, unit: 'B' },
  ].find((item) => item.size >= 1)

  return `${temp.size.toFixed(2)} ${temp.unit}`
}

class PlaylistManager {
  constructor(container, videoManager, files = []) {
    this.allowDuplicates = true
    this.allowedExtensions = ['.avi', '.mp4', '.mkv', '.mp3', '.aac']
    this.files = files
    this.selectedId = -1

    this.container = container
    this.videoManager = videoManager

    this.inputFiles = document.createElement('input')
    this.inputFiles.type = 'file'
    this.inputFiles.hidden = true
    this.inputFiles.multiple = true
    this.inputFiles.accept = this.allowedExtensions.join(',')
    this.inputFiles.addEventListener('change', () => {
      if (this.inputFiles.files.length > 0) {
        this.add(this.inputFiles.files)
      }
    })

    this.playlist = document.createElement('div')
    this.playlist.classList.add('playlist')

    this.toolbar = this.#generateToolbar()
    this.container.appendChild(this.toolbar)

    this.searchInput = document.createElement('input')
    this.searchInput.type = 'search'
    this.searchInput.classList.add('search')
    this.searchInput.placeholder = 'Search...'
    this.searchInput.oninput = (e) => this.updatePlaylist(e.target.value)

    this.container.appendChild(this.searchInput)

    this.container.appendChild(this.playlist)

    this.updatePlaylist()
  }

  #generateToolbar() {
    const toolbar = document.createElement('div')
    toolbar.classList.add('toolbar')

    //Button: Add
    this.addFilesButton = document.createElement('button')
    this.addFilesButton.innerHTML = '<i class="fa-solid fa-folder-open"></i>'
    this.addFilesButton.onclick = () => this.inputFiles.click()

    toolbar.appendChild(this.inputFiles)
    toolbar.appendChild(this.addFilesButton)

    //Button: Mute/Unmute
    this.muteButton = document.createElement('button')
    this.muteButton.innerHTML = '<i class="fa-solid fa-volume-xmark"></i>'
    this.muteButton.onclick = () => {
      const status = this.videoManager.toggleMute()
      this.muteButton.innerHTML = status
        ? '<i class="fa-solid fa-volume-high"></i>'
        : '<i class="fa-solid fa-volume-xmark"></i>'
    }

    toolbar.appendChild(this.muteButton)

    //Button: Previous
    this.previousButton = document.createElement('button')
    this.previousButton.innerHTML = '<i class="fa-solid fa-backward-step"></i>'
    this.previousButton.onclick = () => {
      if (this.files.length === 0) {
        this.inputFiles.click()

        return
      }

      const file = this.getPrevious()
      if (file) {
        this.videoManager.play(file)
        this.updatePlaylist()
      }
    }
    toolbar.appendChild(this.previousButton)

    //Button: Next
    this.nextButton = document.createElement('button')
    this.nextButton.innerHTML = '<i class="fa-solid fa-forward-step"></i>'

    const nextHandler = () => {
      if (this.files.length === 0) {
        this.inputFiles.click()

        return
      }

      const file = this.getNext()
      if (file) {
        this.videoManager.play(file)
        this.updatePlaylist()
      }
    }

    this.nextButton.onclick = nextHandler
    toolbar.appendChild(this.nextButton)

    //Button: Clear
    this.clearButton = document.createElement('button')
    this.clearButton.innerHTML = '<i class="fa-solid fa-broom"></i>'
    this.clearButton.onclick = () => this.clear()
    toolbar.appendChild(this.clearButton)

    return toolbar
  }

  #generatePlaylistItem(file) {
    const div = document.createElement('div')
    div.id = 'playlist-item-' + file.id
    div.classList.add('playlist-item')

    let isActive = this.selectedId === file.id
    let isPaused = isActive && !this.videoManager.isPlaying

    if (isActive) div.classList.add('active')
    if (isPaused) div.classList.add('paused')

    const p = document.createElement('p')
    p.overflow = 'hidden'

    p.innerHTML = `${file.cleanedSize} | ${file.cleanedName}`

    const toolbarDiv = document.createElement('div')
    toolbarDiv.classList.add('playlist-item-toolbar')

    div.appendChild(p)
    div.appendChild(toolbarDiv)

    const playButton = document.createElement('button')
    playButton.innerHTML =
      isActive && this.videoManager.isPlaying
        ? '<i class="fa-solid fa-pause"></i>'
        : '<i class="fa-solid fa-play"></i>'

    const deleteButton = document.createElement('button')
    deleteButton.innerHTML = '<i class="fa-solid fa-trash"></i>'

    deleteButton.onclick = () => {
      this.remove(file.id)
      this.updatePlaylist()
    }

    playButton.onclick = () => {
      if (isActive) {
        this.videoManager.isPlaying
          ? this.videoManager.pause()
          : this.videoManager.resume()
      } else {
        this.selectedId = file.id
        this.videoManager.play(file)
      }
      this.updatePlaylist()
    }

    const status = document.createElement('p')
    status.classList.add('toolbar-status')
    status.innerHTML = `${isPaused ? 'PAUSED' : isActive ? 'PLAYING' : ''}`
    status.style.color = 'white'

    toolbarDiv.appendChild(status)

    const tempDiv = document.createElement('div')
    tempDiv.classList.add('toolbar-buttons')
    tempDiv.appendChild(playButton)
    tempDiv.appendChild(deleteButton)

    toolbarDiv.appendChild(tempDiv)

    return div
  }

  add(files) {
    for (const file of files) {
      const isValidFile = matchExtension(file.name, this.allowedExtensions)

      if (isValidFile) {
        file.id = this.files.length
        file.cleanedName = getCleanFilename(file.name)
        file.cleanedSize = getCleanFileSize(file.size)
        this.files.push(file)
      }
    }

    this.updatePlaylist()
  }

  remove(id) {
    if (this.selectedId === id) this.videoManager.stop()

    this.files = this.files.filter((file) => file.id !== id)
    this.updatePlaylist()
  }

  clear() {
    this.files = []
    this.selectedId = ''
    this.videoManager.stop()
    this.updatePlaylist()
  }

  getNext() {
    if (this.files.length === 0) return null

    this.selectedId++
    if (this.selectedId === this.files.length) this.selectedId = 0

    return this.files[this.selectedId]
  }

  getPrevious() {
    if (this.files.length === 0) return null

    this.selectedId--
    if (this.selectedId <= -1) this.selectedId = this.files.length - 1

    return this.files[this.selectedId]
  }

  updatePlaylist(searchTerm = '') {
    this.playlist.innerHTML = ''
    if (this.files.length === 0) {
      this.searchInput.hidden = true
      this.playlist.style.justifyContent = 'center'
      this.playlist.style.alignItems = 'center'

      const temp = this.addFilesButton.cloneNode(true)
      temp.style.fontSize = '2.5em'
      temp.style.cursor = 'pointer'
      temp.onclick = this.addFilesButton.onclick
      this.playlist.appendChild(temp)
    } else {
      this.searchInput.hidden = false
      searchTerm = searchTerm.toLowerCase()

      this.playlist.style.justifyContent = 'unset'
      this.playlist.style.alignItems = 'unset'

      const filteredFiles = this.files.filter(
        (file) =>
          !searchTerm || file.cleanedName.toLowerCase().includes(searchTerm)
      )

      if (filteredFiles.length === 0) {
        this.playlist.style.justifyContent = 'center'
        this.playlist.style.alignItems = 'center'
        const temp = document.createElement('p')
        temp.innerHTML = 'No matches found'
        temp.style.fontSize = '1.5em'
        temp.style.color = 'white'
        this.playlist.appendChild(temp)
      } else
        filteredFiles.map((file) =>
          this.playlist.appendChild(this.#generatePlaylistItem(file))
        )
    }
  }
}
