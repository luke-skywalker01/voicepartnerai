/**
 * Onboarding Modal Component for VoicePartnerAI
 * Guides new users through the essential first steps
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle, 
  Circle, 
  ArrowRight, 
  ArrowLeft, 
  X,
  Bot,
  Phone,
  Play,
  Zap
} from 'lucide-react';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  actionText: string;
  actionUrl: string;
  completed: boolean;
  estimatedTime: string;
}

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  userProgress?: {
    hasAssistant: boolean;
    hasPhoneNumber: boolean;
    hasTestCall: boolean;
  };
}

const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  onComplete,
  userProgress = {
    hasAssistant: false,
    hasPhoneNumber: false,
    hasTestCall: false
  }
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [animationDirection, setAnimationDirection] = useState(1);

  const steps: OnboardingStep[] = [
    {
      id: 'create-assistant',
      title: '🤖 Ersten Assistenten erstellen',
      description: 'Erstelle deinen ersten KI-Assistenten und konfiguriere seine Persönlichkeit, Stimme und Fähigkeiten. Dies ist das Herzstück deiner VoicePartnerAI-Erfahrung.',
      icon: Bot,
      actionText: 'Assistenten erstellen',
      actionUrl: '/assistants/create',
      completed: userProgress.hasAssistant,
      estimatedTime: '3-5 Min'
    },
    {
      id: 'setup-phone',
      title: '📞 Telefonnummer einrichten',
      description: 'Erwerbe eine lokale oder internationale Telefonnummer und verbinde sie mit deinem Assistenten. Kunden können dann direkt mit deiner KI sprechen.',
      icon: Phone,
      actionText: 'Nummer konfigurieren',
      actionUrl: '/phone-numbers/purchase',
      completed: userProgress.hasPhoneNumber,
      estimatedTime: '2-3 Min'
    },
    {
      id: 'test-call',
      title: '🚀 Ersten Testanruf tätigen',
      description: 'Teste deinen Assistenten mit einem echten Anruf und erlebe die KI in Aktion. Optimiere das Gespräch basierend auf den Ergebnissen.',
      icon: Play,
      actionText: 'Testanruf starten',
      actionUrl: '/test-call',
      completed: userProgress.hasTestCall,
      estimatedTime: '5-10 Min'
    }
  ];

  const completedSteps = steps.filter(step => step.completed).length;
  const progressPercentage = (completedSteps / steps.length) * 100;
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  useEffect(() => {
    // Auto-advance to next incomplete step
    const nextIncompleteStep = steps.findIndex(step => !step.completed);
    if (nextIncompleteStep !== -1 && nextIncompleteStep !== currentStep) {
      setCurrentStep(nextIncompleteStep);
    }
  }, [userProgress]);

  const handleNext = () => {
    if (!isLastStep) {
      setAnimationDirection(1);
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirstStep) {
      setAnimationDirection(-1);
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleStepClick = (stepIndex: number) => {
    setAnimationDirection(stepIndex > currentStep ? 1 : -1);
    setCurrentStep(stepIndex);
  };

  const handleAction = () => {
    window.open(steps[currentStep].actionUrl, '_blank');
  };

  const handleSkip = () => {
    // Mark onboarding as skipped in user preferences
    localStorage.setItem('onboarding_skipped', 'true');
    onClose();
  };

  const handleCompleteOnboarding = () => {
    // Mark onboarding as completed
    localStorage.setItem('onboarding_completed', 'true');
    onComplete();
    onClose();
  };

  if (!isOpen) return null;

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 300 : -300,
      opacity: 0
    })
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold mb-2">
                  Willkommen bei VoicePartnerAI! 🎉
                </h2>
                <p className="text-blue-100">
                  Lass uns gemeinsam deine ersten Schritte durchgehen
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            {/* Progress Bar */}
            <div className="mt-6">
              <div className="flex justify-between text-sm text-blue-100 mb-2">
                <span>Fortschritt</span>
                <span>{completedSteps} von {steps.length} abgeschlossen</span>
              </div>
              <div className="w-full bg-blue-500 bg-opacity-30 rounded-full h-2">
                <motion.div
                  className="bg-white rounded-full h-2"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercentage}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          </div>

          {/* Step Navigation */}
          <div className="px-6 py-4 bg-gray-50 border-b">
            <div className="flex justify-center space-x-4">
              {steps.map((step, index) => (
                <button
                  key={step.id}
                  onClick={() => handleStepClick(index)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all ${
                    index === currentStep
                      ? 'bg-blue-100 text-blue-700'
                      : step.completed
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {step.completed ? (
                    <CheckCircle size={16} className="text-green-600" />
                  ) : (
                    <Circle size={16} />
                  )}
                  <span className="text-sm font-medium hidden sm:block">
                    Schritt {index + 1}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Step Content */}
          <div className="relative overflow-hidden">
            <AnimatePresence mode="wait" custom={animationDirection}>
              <motion.div
                key={currentStep}
                custom={animationDirection}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  x: { type: "spring", stiffness: 300, damping: 30 },
                  opacity: { duration: 0.2 }
                }}
                className="p-8"
              >
                <div className="text-center">
                  {/* Step Icon */}
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-6">
                    <steps[currentStep].icon size={32} className="text-blue-600" />
                  </div>

                  {/* Step Content */}
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    {steps[currentStep].title}
                  </h3>
                  
                  <p className="text-gray-600 text-lg leading-relaxed mb-6 max-w-lg mx-auto">
                    {steps[currentStep].description}
                  </p>

                  {/* Time Estimate */}
                  <div className="inline-flex items-center space-x-2 text-sm text-gray-500 mb-8">
                    <Zap size={16} />
                    <span>Geschätzte Zeit: {steps[currentStep].estimatedTime}</span>
                  </div>

                  {/* Action Button */}
                  <div className="space-y-4">
                    {steps[currentStep].completed ? (
                      <div className="inline-flex items-center space-x-2 text-green-600 bg-green-50 px-4 py-2 rounded-lg">
                        <CheckCircle size={20} />
                        <span className="font-medium">Abgeschlossen! ✨</span>
                      </div>
                    ) : (
                      <button
                        onClick={handleAction}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-colors inline-flex items-center space-x-2"
                      >
                        <span>{steps[currentStep].actionText}</span>
                        <ArrowRight size={16} />
                      </button>
                    )}

                    {/* Additional Tips */}
                    <div className="text-xs text-gray-500 max-w-md mx-auto">
                      💡 <strong>Tipp:</strong> Du kannst dieses Tutorial jederzeit über das Hilfemenü wieder öffnen.
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer Navigation */}
          <div className="bg-gray-50 px-6 py-4 flex justify-between items-center">
            <button
              onClick={handlePrev}
              disabled={isFirstStep}
              className={`inline-flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                isFirstStep
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
              }`}
            >
              <ArrowLeft size={16} />
              <span>Zurück</span>
            </button>

            <div className="flex space-x-3">
              <button
                onClick={handleSkip}
                className="text-gray-500 hover:text-gray-700 px-4 py-2 rounded-lg transition-colors"
              >
                Später
              </button>
              
              {completedSteps === steps.length ? (
                <button
                  onClick={handleCompleteOnboarding}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  Tutorial beenden 🎉
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  disabled={isLastStep}
                  className={`inline-flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    isLastStep
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-blue-600 hover:text-blue-700 hover:bg-blue-50'
                  }`}
                >
                  <span>Weiter</span>
                  <ArrowRight size={16} />
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default OnboardingModal;