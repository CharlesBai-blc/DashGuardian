# DashGuardian 🛡️

> AI-powered dashcam analysis that transforms collision footage into actionable insurance reports in seconds.

[![React](https://img.shields.io/badge/React-19.2.0-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7.2.4-purple.svg)](https://vite.dev/)

DashGuardian is an intelligent video analysis platform that automatically processes dashcam footage to determine collision timing, fault assignment, and generate comprehensive incident reports. Built with React, TypeScript, and Google Gemini AI, it eliminates the need for manual video review and speeds up insurance claim processing.

---

## ✨ Features

### 🎯 Core Capabilities

- **Automatic Collision Detection** - Pinpoints the exact moment of impact with sub-second precision using median-based timing algorithms
- **Intelligent Fault Classification** - Objectively determines if the POV vehicle was the victim, offender, or witness using consensus-based AI analysis
- **Comprehensive Incident Reports** - Generates structured narratives covering the before, during, and after phases of collisions
- **Visual Timeline Interface** - Interactive collision timeline with precise markers for quick reference
- **Parallel AI Analysis** - Runs 8 simultaneous API calls with 60% consensus threshold for improved accuracy and reliability

### 🎨 User Experience

- **Modern UI/UX** - Smooth page transitions, snap-scroll navigation, and animated logo
- **Real-time Progress** - Visual feedback during analysis with loading states and progress indicators
- **Responsive Design** - Optimized for desktop and tablet viewing
- **Video Player Integration** - Built-in video player with collision timeline overlay

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and npm/yarn
- **Google Gemini API Key** ([Get one here](https://aistudio.google.com/app/apikey) or via [Google Cloud Console](https://console.cloud.google.com/))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/DashGuardian.git
   cd DashGuardian/dashguardian
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Create a `.env` file in the `dashguardian` directory:
   ```env
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   
   Navigate to `http://localhost:5173` (or the port shown in your terminal)

### Building for Production

```bash
npm run build
npm run preview
```

---

## 📖 Usage Guide

### Analyzing a Dashcam Video

1. **Navigate to Analysis Page**
   - Click "Dash to the Future" on the home page
   - Or click the floating logo to switch between pages

2. **Upload Your Video**
   - Click the upload area or drag-and-drop your dashcam video file
   - Supported formats: MP4, WebM, MOV (standard video formats)

3. **Start Analysis**
   - Click the "Analyze Video" button
   - The system will:
     - Convert your video to base64 format
     - Make 8 parallel API calls to Gemini for consensus analysis
     - Generate a video summary
     - Automatically analyze the three time sections (ante, event, post)

4. **Review Results**
   - **Top Section**: View your video with collision timeline marker
   - **Analysis Panel**: See fault classification, collision time, and summary
   - **Section Pages**: Scroll through detailed analysis of:
     - **Ante** (Before collision)
     - **Event** (Collision moment)
     - **Post** (After collision)

### Understanding Results

- **Fault Classification**: 
  - `victim` - POV vehicle was struck by another vehicle
  - `offender` - POV vehicle's actions caused the collision
  - `witness` - POV vehicle observed but wasn't involved

- **Collision Time**: Median timestamp from 8 independent analyses (sub-second precision)

- **Time Window**: A 2-4 second window guaranteed to contain the collision moment

---

## 🏗️ Project Structure

```
dashguardian/
├── public/                 # Static assets
│   ├── LogoWhite.png      # Application logo
│   ├── broll1.mp4         # Home page background video
│   └── ...
├── src/
│   ├── components/         # React components
│   │   ├── AnalysisPanel.tsx
│   │   ├── CollisionTimeline.tsx
│   │   ├── VideoPlayer.tsx
│   │   └── ...
│   ├── services/          # API services
│   │   └── apiService.ts  # Gemini API integration
│   ├── hooks/             # Custom React hooks
│   │   ├── useVideoDuration.ts
│   │   └── useVideoSections.ts
│   ├── utils/             # Utility functions
│   │   ├── fileUtils.ts   # File conversion utilities
│   │   ├── mathUtils.ts   # Median calculations
│   │   └── parseUtils.ts  # JSON parsing helpers
│   ├── types/             # TypeScript type definitions
│   ├── App.tsx            # Main application component
│   ├── AnalyzePage.tsx    # Analysis page component
│   ├── VideoAnalyzer.tsx  # Core video analysis logic
│   ├── prompts.json       # AI prompt templates
│   └── ...
├── package.json
├── vite.config.ts
└── tsconfig.json
```

---

## 🔧 Technical Details

### Architecture

- **Frontend Framework**: React 19.2 with TypeScript
- **Build Tool**: Vite 7.2 for fast development and optimized builds
- **AI Model**: Google Gemini 3 Flash Preview (multimodal video understanding)
- **API Integration**: Direct Gemini API with parallel request handling

### Analysis Pipeline

1. **Video Upload** → Convert to base64 data URI
2. **Initial Analysis** → 8 parallel API calls for consensus
3. **Result Aggregation**:
   - Calculate median collision time from all results
   - Determine fault via majority vote (60% consensus threshold)
   - Generate video summary
4. **Section Analysis** → Analyze ante/event/post periods with perspective-specific prompts
5. **Report Generation** → Structure results into comprehensive incident report

### Key Algorithms

- **Median Timing**: Uses median of 8 independent collision time estimates for robustness
- **Consensus Voting**: Requires 60% agreement (5/8 votes) for high-confidence fault classification
- **Time Window Calculation**: Median of start/end times from all analyses

---

## 🛠️ Development

### Available Scripts

```bash
npm run dev      # Start development server with hot reload
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

### Code Style

- TypeScript strict mode enabled
- ESLint configured with React hooks and TypeScript rules
- Component-based architecture with clear separation of concerns

### Adding New Features

1. **New Components**: Add to `src/components/` and export via `index.ts`
2. **API Changes**: Modify `src/services/apiService.ts`
3. **Type Definitions**: Update `src/types/index.ts`
4. **Prompts**: Edit `src/prompts.json` for AI behavior changes

---

## 🔐 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_GEMINI_API_KEY` | Google Gemini API key for video analysis | Yes |

---

## 📊 API Usage

### Gemini API Integration

DashGuardian uses the Google Gemini API for video analysis:

- **Model**: `gemini-3-flash-preview`
- **Endpoint**: `https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent`
- **Request Format**: JSON with base64-encoded video data
- **Response Format**: JSON-structured analysis results

### Rate Limits

- Default Gemini API rate limits apply
- Parallel requests (8 simultaneous) are used for initial analysis
- Consider implementing request queuing for production scale

---

## 🐛 Troubleshooting

### Common Issues

**"API key not configured" error**
- Ensure `.env` file exists in `dashguardian/` directory
- Verify `VITE_GEMINI_API_KEY` is set correctly
- Restart the development server after adding environment variables

**Video upload fails**
- Check file format (MP4, WebM, MOV supported)
- Verify file size (large files may take time to convert)
- Check browser console for specific errors

**Analysis returns inconsistent results**
- This is expected behavior - the system uses consensus voting
- Results improve with multiple parallel analyses
- Check API key validity and quota limits

**Build errors**
- Run `npm install` to ensure dependencies are installed
- Clear `node_modules` and reinstall if issues persist
- Check Node.js version (18+ required)

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Write TypeScript with proper type definitions
- Follow existing code style and component patterns
- Add comments for complex logic
- Test your changes thoroughly
- Update documentation as needed

---

## 📝 License

Copyright © 2026 DashGuardian. All Rights Reserved.

---

## 🙏 Acknowledgments

- **Google Gemini** for multimodal AI capabilities
- **React Team** for the excellent framework
- **Vite** for the blazing-fast build tool
- The open-source community for inspiration and tools

---

## 🔮 Roadmap

- [ ] Fleet management integration for commercial operators
- [ ] Real-time dashcam streaming analysis
- [ ] Multi-camera fusion for 360° incident reconstruction
- [ ] Direct insurance API integrations
- [ ] Trend analytics dashboard
- [ ] Mobile app support
- [ ] Export to PDF/Word report formats
- [ ] Multi-language support

---

## 📧 Support

For issues, questions, or feature requests:

- Open an issue on GitHub
- Check existing documentation
- Review the troubleshooting section

---

**Built with ❤️ for faster, fairer insurance claims processing.**
