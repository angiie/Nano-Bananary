import React, { useState } from 'react';
import { extractWatermark } from '../utils/fileUtils';
import { useTranslation } from '../i18n/context';

interface WatermarkDetectorProps {
  className?: string;
}

/**
 * 水印检测组件
 * 允许用户上传图片并检测其中的隐藏水印
 */
export const WatermarkDetector: React.FC<WatermarkDetectorProps> = ({ className = '' }) => {
  const { t } = useTranslation();
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectionResult, setDetectionResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 检查文件类型
    if (!file.type.startsWith('image/')) {
      setError(t('watermarkDetector.invalidFileType'));
      return;
    }

    setError(null);
    setDetectionResult(null);

    // 读取文件为 data URL
    const reader = new FileReader();
    reader.onload = async (e) => {
      const imageUrl = e.target?.result as string;
      setSelectedImage(imageUrl);
      
      // 开始检测水印
      setIsDetecting(true);
      try {
        const watermark = await extractWatermark(imageUrl);
        setDetectionResult(watermark);
      } catch (err) {
        setError(t('watermarkDetector.detectionError'));
        console.error('Watermark detection error:', err);
      } finally {
        setIsDetecting(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const resetDetector = () => {
    setSelectedImage(null);
    setDetectionResult(null);
    setError(null);
    setIsDetecting(false);
  };

  return (
    <div className={`watermark-detector ${className}`}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {t('watermarkDetector.title')}
        </h3>
        
        {!selectedImage ? (
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              id="watermark-file-input"
            />
            <label
              htmlFor="watermark-file-input"
              className="cursor-pointer flex flex-col items-center"
            >
              <svg
                className="w-12 h-12 text-gray-400 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <span className="text-gray-600 dark:text-gray-300">
                {t('watermarkDetector.uploadPrompt')}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                {t('watermarkDetector.supportedFormats')}
              </span>
            </label>
          </div>
        ) : (
          <div className="space-y-4">
            {/* 图片预览 */}
            <div className="relative">
              <img
                src={selectedImage}
                alt="Selected for watermark detection"
                className="max-w-full max-h-64 mx-auto rounded-lg shadow-sm"
              />
              <button
                onClick={resetDetector}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600 transition-colors"
              >
                ×
              </button>
            </div>

            {/* 检测状态 */}
            {isDetecting && (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="ml-3 text-gray-600 dark:text-gray-300">
                  {t('watermarkDetector.detecting')}
                </span>
              </div>
            )}

            {/* 检测结果 */}
            {!isDetecting && detectionResult !== null && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <h4 className="text-green-800 dark:text-green-200 font-medium mb-2">
                  {t('watermarkDetector.watermarkFound')}
                </h4>
                <p className="text-green-700 dark:text-green-300 font-mono bg-green-100 dark:bg-green-900/40 p-2 rounded">
                  "{detectionResult}"
                </p>
              </div>
            )}

            {/* 无水印结果 */}
            {!isDetecting && detectionResult === null && !error && selectedImage && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <h4 className="text-yellow-800 dark:text-yellow-200 font-medium">
                  {t('watermarkDetector.noWatermarkFound')}
                </h4>
                <p className="text-yellow-700 dark:text-yellow-300 text-sm mt-1">
                  {t('watermarkDetector.noWatermarkDescription')}
                </p>
              </div>
            )}

            {/* 错误信息 */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <h4 className="text-red-800 dark:text-red-200 font-medium">
                  {t('watermarkDetector.error')}
                </h4>
                <p className="text-red-700 dark:text-red-300 text-sm mt-1">
                  {error}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default WatermarkDetector;