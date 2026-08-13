export default function FaceAvatar({ isThinking, isSpeaking, emotion = 'neutral', customSizeClass }) {
  const isAction = isThinking || isSpeaking || emotion !== 'neutral';

  let leftEyebrow = '';
  let rightEyebrow = '';
  let leftEyeScale = '';
  let rightEyeScale = '';
  let mouthStyle = '';

  if (emotion === 'angry') {
    leftEyebrow = 'rotate-[20deg] translate-y-0 sm:translate-y-1';
    rightEyebrow = 'rotate-[-20deg] translate-y-0 sm:translate-y-1';
    leftEyeScale = 'scale-y-[0.6]';
    rightEyeScale = 'scale-y-[0.6]';
    mouthStyle = 'w-5 sm:w-8 h-1 bg-white dark:bg-white rounded-none shadow-[0_0_20px_rgba(255,255,255,0.8)]';
  } else if (emotion === 'happy') {
    leftEyebrow = 'translate-y-[-4px] sm:translate-y-[-8px]';
    rightEyebrow = 'translate-y-[-4px] sm:translate-y-[-8px]';
    mouthStyle = 'w-8 sm:w-14 h-3 sm:h-6 rounded-b-[2rem] rounded-t-sm bg-cyan-400 dark:bg-white translate-y-1 shadow-[0_0_20px_rgba(34,211,238,0.8)] dark:shadow-[0_0_30px_rgba(255,255,255,1)]';
  } else if (emotion === 'worried') {
    leftEyebrow = 'rotate-[-15deg] translate-y-[-2px] sm:translate-y-[-4px]';
    rightEyebrow = 'rotate-[15deg] translate-y-[-2px] sm:translate-y-[-4px]';
    mouthStyle = 'w-3 sm:w-6 h-1.5 sm:h-3 rounded-full bg-cyan-300 dark:bg-blue-200 shadow-[0_0_10px_rgba(103,232,249,0.5)]';
  } else if (emotion === 'confused') {
    leftEyebrow = 'rotate-[15deg] translate-y-0 sm:translate-y-1';
    rightEyebrow = 'rotate-[10deg] translate-y-[-6px]';
    leftEyeScale = 'scale-y-[0.6]';
    mouthStyle = 'w-5 sm:w-8 h-1.5 sm:h-3 rounded-md rotate-[-15deg] translate-x-2 sm:translate-x-3 bg-cyan-300 dark:bg-blue-200 shadow-[0_0_10px_rgba(103,232,249,0.5)]';
  } else {
    if (isThinking) {
      leftEyebrow = 'rotate-[5deg] translate-y-1';
      rightEyebrow = 'rotate-[-5deg] translate-y-1';
    }
  }

  let finalMouthStyle = emotion !== 'neutral' 
    ? mouthStyle 
    : 'w-8 sm:w-12 h-1.5 sm:h-3 rounded-sm sm:rounded-lg bg-cyan-200/40 dark:bg-blue-200/40 shadow-[0_0_10px_rgba(103,232,249,0.3)] dark:shadow-[0_0_10px_rgba(191,219,254,0.3)] opacity-50';

  if (isSpeaking) {
    if (emotion === 'neutral') {
      finalMouthStyle = 'mouth-talk bg-cyan-400 dark:bg-white shadow-[0_0_20px_rgba(34,211,238,0.8)] dark:shadow-[0_0_30px_rgba(255,255,255,1)] w-8 sm:w-12 h-1.5 sm:h-3 rounded-sm sm:rounded-lg';
    } else {
      finalMouthStyle += ' mouth-talk';
    }
  }

  const eyeBase = isThinking && emotion === 'neutral' 
    ? 'eye-think-left bg-cyan-400 shadow-[0_0_30px_rgba(34,211,238,0.8)] dark:bg-white dark:shadow-[0_0_30px_rgba(255,255,255,1)]' 
    : 'eye-blink bg-cyan-300 shadow-[0_0_20px_rgba(103,232,249,0.6)] dark:bg-blue-50 dark:shadow-[0_0_20px_rgba(239,246,255,0.8)]';

  const rightEyeBase = isThinking && emotion === 'neutral'
    ? 'eye-think-right bg-cyan-400 shadow-[0_0_30px_rgba(34,211,238,0.8)] dark:bg-white dark:shadow-[0_0_30px_rgba(255,255,255,1)]' 
    : 'eye-blink bg-cyan-300 shadow-[0_0_20px_rgba(103,232,249,0.6)] dark:bg-blue-50 dark:shadow-[0_0_20px_rgba(239,246,255,0.8)]';

  const sizeClasses = customSizeClass || 'w-36 h-36 sm:w-56 sm:h-56 md:w-72 md:h-72';

  return (
    <div className={`relative flex items-center justify-center ${sizeClasses} rounded-[2rem] sm:rounded-[3.5rem] bg-gradient-to-br from-black/5 via-black/10 to-transparent dark:from-blue-400 dark:via-blue-500 dark:to-blue-600 border border-black/10 dark:border-blue-300 backdrop-blur-2xl transition-all duration-700 ${isAction ? 'face-active' : 'face-float'}`}>
      {/* Inner glow and shadow */}
      <div className={`absolute inset-0 rounded-[2rem] sm:rounded-[3.5rem] shadow-[inset_0_0_60px_rgba(255,255,255,0.5)] dark:shadow-[inset_0_0_60px_rgba(255,255,255,0.3)] pointer-events-none transition-all duration-700 ${isAction ? 'shadow-[0_15px_60px_rgba(0,0,0,0.15)] dark:shadow-[0_0_80px_rgba(59,130,246,0.6)]' : 'shadow-[0_10px_40px_rgba(0,0,0,0.1)] dark:shadow-[0_0_40px_rgba(59,130,246,0.3)]'}`} />

      {/* Eyes Container */}
      <div className={`flex gap-6 sm:gap-14 z-10 transition-transform duration-500 ${isSpeaking ? 'translate-y-[-10px]' : 'mt-[-10%]'}`}>
        
        {/* Left Eye */}
        <div className={`relative flex items-center justify-center w-8 h-10 sm:w-14 sm:h-14 rounded-lg sm:rounded-2xl transition-all duration-300 ${eyeBase}`}>
          <div className={`absolute inset-0 flex items-center justify-center transition-transform duration-300 ${leftEyeScale}`}>
            {/* Eyebrow */}
            <div className={`absolute -top-5 sm:-top-10 w-10 h-3 sm:w-16 sm:h-6 bg-slate-800 dark:bg-blue-950 rounded-full z-20 transition-transform duration-300 ${leftEyebrow}`} />
          </div>
        </div>
        
        {/* Right Eye */}
        <div className={`relative flex items-center justify-center w-8 h-10 sm:w-14 sm:h-14 rounded-lg sm:rounded-2xl transition-all duration-300 ${rightEyeBase}`}>
          <div className={`absolute inset-0 flex items-center justify-center transition-transform duration-300 ${rightEyeScale}`}>
            {/* Eyebrow */}
            <div className={`absolute -top-5 sm:-top-10 w-10 h-3 sm:w-16 sm:h-6 bg-slate-800 dark:bg-blue-950 rounded-full z-20 transition-transform duration-300 ${rightEyebrow}`} />
          </div>
        </div>
      </div>

      {/* Mouth */}
      <div className={`absolute bottom-[22%] sm:bottom-[25%] z-10 transition-all duration-300 ${finalMouthStyle}`} />
    </div>
  );
}
