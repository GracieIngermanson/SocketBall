// Create an object for storing data about each chat room
// Each chat room name will store an object mapping socket ids
// to information about the corresponding user
const chatRooms = {}

const enterChatRoom = (serverSocket, serverIO, username, chatRoomName) => {
  // Join the room
  serverSocket.join(chatRoomName)
  if (!chatRooms[chatRoomName]) {
    // First user to join the chat––add an empty object for keeping track of users
    chatRooms[chatRoomName] = {}
  }
  const participants = chatRooms[chatRoomName]
  // Store the new user's information to the participants object
  participants[serverSocket.id] = {username}
  // Let everyone in the chat know who the current participants are
  serverIO.in(chatRoomName).emit('updateParticipants', participants)
}

// Callback invoked when serverSocket is about to disconnect
const leaveChatRoom = (serverSocket, serverIO) => {
  for (let chatRoomName of Object.keys(chatRooms)) {
    let participants = chatRooms[chatRoomName]
    // Find any chat rooms that serverSocket belonged to
    if (participants[serverSocket.id]) {
      delete participants[serverSocket.id]
      // Let the users still in the chat know who the remaining participants are
      serverIO.in(chatRoomName).emit('updateParticipants', participants)
    }
  }
}
module.exports = serverIO => {
  serverIO.on('connection', serverSocket => {
    serverSocket.on('enterChatRoom', (username, chatRoomName) =>
      enterChatRoom(serverSocket, serverIO, username, chatRoomName)
    )

    serverSocket.on('sendDM', (recipientId, message) => {
      serverSocket.to(recipientId).emit('displayDM', serverSocket.id, message)
    })

    serverSocket.on('sendChat', (chatRoomName, message) => {
      serverSocket
        .to(chatRoomName)
        .emit('displayChat', serverSocket.id, message)
    })

    serverSocket.on('disconnect', () => leaveChatRoom(serverSocket, serverIO))
  })
}
