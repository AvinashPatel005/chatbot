import './App.css'
import ChatPage from './components/ChatPage'
import ImageBot from './components/ImageBot'
import useUniqueUserId from './components/UniqueID'

function App() {
  const userId = useUniqueUserId();
  return (
    <>
    <ChatPage userid={userId}/>
    <ImageBot/>
    </>
  )
}

export default App
