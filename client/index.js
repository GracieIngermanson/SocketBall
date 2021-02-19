import io from 'socket.io-client'

const clientSocket = io(window.location.origin)

let username = ''
let chatRoomName = ''
let chatParticipants = {}

const entryForm = document.getElementById('entry-form')
const usernameInput = document.getElementById('username')
const chatRoomNameInput = document.getElementById('chat-room-name')
const entryButton = document.getElementById('entry-button')

const chatRoom = document.getElementById('chat-room')
const chatForm = document.getElementById('chat-form')
const participantsSelect = document.getElementById('participants-select')
const messageInput = document.getElementById('message')
const chatMessages = document.getElementById('chat-messages')
const sendButton = document.getElementById('send-button')

entryButton.addEventListener('click', event => {
  event.preventDefault()
  username = usernameInput.value
  chatRoomName = chatRoomNameInput.value

  entryButton.disabled = true
  entryForm.style.display = 'none'
  chatRoom.style.display = 'flex'
  sendButton.disabled = false
  clientSocket.emit('enterChatRoom', username, chatRoomName)
})

const appendMessage = (sender, recipient, message) => {
  chatMessages.innerHTML += `<p><strong>${sender} (to &nbsp${recipient})</strong>: ${message}</p>`
}

const submitMessage = event => {
  event.preventDefault()
  let message = messageInput.value
  messageInput.value = ''
  appendMessage(
    'Me',
    participantsSelect.options[participantsSelect.selectedIndex].text,
    message
  )
  if (participantsSelect.value === chatRoomName) {
    clientSocket.emit('sendChat', chatRoomName, message)
  } else {
    clientSocket.emit('sendDM', participantsSelect.value, message)
  }
}

// Update the dropdown menu of chat participants to send direct messages to
const updateParticipants = participants => {
  // Save a copy of the participants object
  chatParticipants = participants
  participantsSelect.innerHTML = `<option value=${chatRoomName} selected>Everyone</option>`
  Object.keys(chatParticipants).forEach(participantId => {
    // Show the user a list of everyone else
    if (participantId !== clientSocket.id) {
      participantsSelect.innerHTML += `<option value=${participantId}>${
        participants[participantId].username
      }</option>`
    }
  })
  chatForm.addEventListener('submit', submitMessage)
}

const displayDM = (senderId, message) => {
  appendMessage(chatParticipants[senderId].username, 'Me', message)
}

const displayChat = (senderId, message) => {
  appendMessage(chatParticipants[senderId].username, 'Everyone', message)
}

clientSocket.on('updateParticipants', updateParticipants)
clientSocket.on('displayDM', displayDM)
clientSocket.on('displayChat', displayChat)

export default clientSocket
