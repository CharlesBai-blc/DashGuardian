
import './App.css'
import { VideoAnalyzer } from './VideoAnalyzer'

function App() {
  return (
    <div id="page" className="primary">
      <div id="top">
        <a id="Home" className="active">Home</a>
        <a id="Analyze">Analyze</a>
      </div>
      
      <div id="main">
        <div id="left">
          {/* <video id="video" src="assets/vid.mp4" type="video/mp4"></video> */}
          {/* autoplay muted loop */}

          <video playsInline controls id="video">
            <source src="/vid.mp4" type="video/mp4"/>
          </video>
          <div id="controls">
            <div id="scroll">
              
            </div>
          </div>
        </div>
        <div id="right">
          <div className="title">Dashcam Analyzer</div>
          <div className="text">
            Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.
          </div>
        </div>
      </div>
      
      
      
      <VideoAnalyzer />
      
    </div>
  )
}

export default App
