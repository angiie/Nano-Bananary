import type { GeneratedContent } from '../types';

// LaoZhang API 配置
const API_KEY = import.meta.env.VITE_LAOZHANG_API_KEY;
const BASE_URL = import.meta.env.VITE_LAOZHANG_BASE_URL;

if (!API_KEY) {
  throw new Error("LAOZHANG_API_KEY environment variable is not set.");
}

if (!BASE_URL) {
  throw new Error("LAOZHANG_BASE_URL environment variable is not set.");
}

/**
 * 使用 LaoZhang API 编辑图像
 * @param base64ImageData 主图像的 base64 数据
 * @param mimeType 图像的 MIME 类型
 * @param prompt 编辑提示词
 * @param maskBase64 遮罩图像的 base64 数据（可选）
 * @param secondaryImage 辅助图像数据（可选）
 * @returns Promise<GeneratedContent> 生成的内容
 */
export async function editImage(
    base64ImageData: string, 
    mimeType: string, 
    prompt: string,
    maskBase64: string | null,
    secondaryImage: { base64: string; mimeType: string } | null
): Promise<GeneratedContent> {
  try {
    let fullPrompt = prompt;
    
    // 构建 content 数组，先添加文本提示
    const content: any[] = [
      {
        type: "text",
        text: fullPrompt,
      }
    ];

    // 添加主图像
    content.push({
      type: "image_url",
      image_url: {
        url: `data:${mimeType};base64,${base64ImageData}`,
      },
    });

    // 如果有遮罩，修改提示词并添加遮罩图像
    if (maskBase64) {
      fullPrompt = `Apply the following instruction only to the masked area of the image: "${prompt}". Preserve the unmasked area.`;
      content[0].text = fullPrompt;
      
      content.push({
        type: "image_url",
        image_url: {
          url: `data:image/png;base64,${maskBase64}`,
        },
      });
    }
    
    // 如果有辅助图像，添加到 content 中
    if (secondaryImage) {
      content.push({
        type: "image_url",
        image_url: {
          url: `data:${secondaryImage.mimeType};base64,${secondaryImage.base64}`,
        },
      });
    }

    const requestBody = {
      model: "gemini-2.5-flash-image-preview",
      stream: false,
      messages: [
        {
          role: "user",
          content: content,
        },
      ],
    };

    const response = await fetch(`${BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      let errorMsg = `LaoZhang API 请求失败 (${response.status}): ${response.statusText}`;
      try {
        const errorData = await response.json();
        if (errorData.error && errorData.error.message) {
          errorMsg = `LaoZhang API 请求失败 (${response.status}): ${errorData.error.message}`;
        } else if (errorData.message) {
          errorMsg = `LaoZhang API 请求失败 (${response.status}): ${errorData.message}`;
        }
      } catch (jsonError) {
        const text = await response.text();
        errorMsg = `LaoZhang API 请求失败 (${response.status}): ${text}`;
      }
      throw new Error(errorMsg);
    }

    const result = await response.json();
    
    // 检查响应中是否包含数据
    if (!result.choices || result.choices.length === 0) {
      throw new Error("LaoZhang API 没有返回有效数据。");
    }

    const choice = result.choices[0];
    if (!choice.message || choice.message.content === undefined) {
      throw new Error("LaoZhang API 返回的数据格式不符合预期。");
    }

    // 处理返回的内容
    const contentStr = choice.message.content;
    const generatedContent: GeneratedContent = { imageUrl: null, text: null };

    // 提取图片URL的正则表达式 - 支持HTTP URL和base64数据
    const imageUrlRegex = /!\[.*?\]\(((?:https?:\/\/[^\s)]+|data:image\/[^;]+;base64,[A-Za-z0-9+\/=]+))\)|(?:https?:\/\/[^\s\[\]()]+\.(?:png|jpg|jpeg|gif|webp)|data:image\/[^;]+;base64,[A-Za-z0-9+\/=]+)/gi;
    let match;
    const imageUrls: string[] = [];

    // 逐个提取所有匹配的URL
    while ((match = imageUrlRegex.exec(contentStr)) !== null) {
      if (match[1]) {
        // markdown格式中的URL
        imageUrls.push(match[1]);
      } else if (match[0]) {
        // 直接匹配的URL
        imageUrls.push(match[0]);
      }
    }

    // 如果找到图片URL，使用第一个
    if (imageUrls.length > 0) {
      generatedContent.imageUrl = imageUrls[0];
    }

    // 提取文本内容（去除图片markdown）
    const textContent = contentStr.replace(imageUrlRegex, '').trim();
    if (textContent) {
      generatedContent.text = textContent;
    }

    // 如果没有找到图片，抛出错误
    if (!generatedContent.imageUrl) {
      let errorMessage = "模型没有返回图片。请尝试不同的图片或提示词。";
      if (generatedContent.text) {
        errorMessage = `模型响应: "${generatedContent.text}"`;
      }
      throw new Error(errorMessage);
    }

    return generatedContent;

  } catch (error) {
    console.error("调用 LaoZhang API 时出错:", error);
    if (error instanceof Error) {
      let errorMessage = error.message;
      try {
        const parsedError = JSON.parse(errorMessage);
        if (parsedError.error && parsedError.error.message) {
          if (parsedError.error.status === 'RESOURCE_EXHAUSTED') {
            errorMessage = "您可能已超过请求限制。请稍等片刻后再试。";
          } else if (parsedError.error.code === 500 || parsedError.error.status === 'UNKNOWN') {
            errorMessage = "发生了意外的服务器错误。这可能是临时问题。请稍后再试。";
          } else {
            errorMessage = parsedError.error.message;
          }
        }
      } catch (e) {}
      throw new Error(errorMessage);
    }
    throw new Error("与 API 通信时发生未知错误。");
  }
}

/**
 * 生成视频（基于 LaoZhang API 的图像生成能力模拟视频生成）
 * @param prompt 提示词
 * @param image 可选的输入图像
 * @param aspectRatio 宽高比
 * @param onProgress 进度回调函数
 * @returns 生成的视频内容
 */
export async function generateVideo(
  prompt: string,
  image?: { data: string; mimeType: string },
  aspectRatio?: string,
  onProgress?: (progress: number) => void
): Promise<GeneratedContent> {
  try {
    // 由于 LaoZhang API 主要支持图像生成，我们将视频生成转换为图像生成
    // 并提供一个占位符视频 URL
    
    if (onProgress) onProgress(10);
    
    // 构建视频生成的提示词
    const videoPrompt = `Create a video-like image sequence for: ${prompt}. ${aspectRatio ? `Aspect ratio: ${aspectRatio}` : ''}`;
    
    if (onProgress) onProgress(30);
    
    // 使用 editImage 函数生成关键帧图像
    const imageResult = await editImage(
      image?.data || '',
      image?.mimeType || 'image/jpeg',
      videoPrompt,
      null,
      null
    );
    
    if (onProgress) onProgress(70);
    
    // 模拟视频生成过程
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    if (onProgress) onProgress(100);
    
    // 返回生成的内容，包含图像和模拟的视频 URL
    return {
      imageUrl: imageResult.imageUrl,
      text: imageResult.text + '\n\n注意：LaoZhang API 不直接支持视频生成，这里返回的是关键帧图像。',
      videoUrl: 'data:video/mp4;base64,', // 占位符视频 URL
    };
    
  } catch (error) {
    console.error('Video generation failed:', error);
    throw new Error(`视频生成失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}