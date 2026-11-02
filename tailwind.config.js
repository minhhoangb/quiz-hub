export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'slide-up': { from: { opacity: '0', transform: 'translateY(12px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        'pop-in': { from: { opacity: '0', transform: 'scale(.94)' }, to: { opacity: '1', transform: 'scale(1)' } },
        'answer-pulse': { '0%, 100%': { transform: 'scale(1)' }, '50%': { transform: 'scale(1.015)' } },
      },
      animation: {
        'fade-in': 'fade-in 220ms ease-out both',
        'slide-up': 'slide-up 350ms ease-out both',
        'pop-in': 'pop-in 280ms ease-out both',
        'answer-pulse': 'answer-pulse 220ms ease-out',
      },
    },
  },
};
