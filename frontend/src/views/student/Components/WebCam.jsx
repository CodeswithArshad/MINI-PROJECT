import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as tf from '@tensorflow/tfjs';
import * as cocossd from '@tensorflow-models/coco-ssd';
import Webcam from 'react-webcam';
import { drawRect } from './utilities';
import { Box, Card } from '@mui/material';
import swal from 'sweetalert';
import { UploadClient } from '@uploadcare/upload-client';

const client = new UploadClient({ publicKey: 'e69ab6e5db6d4a41760b' });

export default function Home({ cheatingLog, updateCheatingLog }) {
  const navigate = useNavigate();
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [lastDetectionTime, setLastDetectionTime] = useState({});
  const [screenshots, setScreenshots] = useState([]);
  const [isExamTerminated, setIsExamTerminated] = useState(false);
  
  // Keep counts in refs to ensure we always have current values
  const countsRef = useRef({
    noFaceCount: 0,
    multipleFaceCount: 0,
    cellPhoneCount: 0,
    prohibitedObjectCount: 0
  });

  // Initialize screenshots array when component mounts
  useEffect(() => {
    if (cheatingLog && cheatingLog.screenshots) {
      setScreenshots(cheatingLog.screenshots);
    }
  }, [cheatingLog]);

  const captureScreenshotAndUpload = async (type) => {
    const video = webcamRef.current?.video;

    if (
      !video ||
      video.readyState !== 4 || // ensure video is ready
      video.videoWidth === 0 ||
      video.videoHeight === 0
    ) {
      console.warn('Video not ready for screenshot');
      return null;
    }

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/jpeg');
    const file = dataURLtoFile(dataUrl, `cheating_${Date.now()}.jpg`);

    try {
      const result = await client.uploadFile(file);
      console.log('✅ Uploaded to Uploadcare:', result.cdnUrl);
      
      const newScreenshot = {
        url: result.cdnUrl,
        type: type,
        detectedAt: new Date().toISOString()
      };
      
      // Update local screenshots state
      setScreenshots(prev => [...prev, newScreenshot]);
      
      return newScreenshot;
    } catch (error) {
      console.error('❌ Upload failed:', error);
      return null;
    }
  };

  const handleDetection = async (type) => {
    const now = Date.now();
    const lastTime = lastDetectionTime[type] || 0;

    if (now - lastTime >= 3000) {
      setLastDetectionTime((prev) => ({ ...prev, [type]: now }));

      // Capture and upload screenshot
      const screenshot = await captureScreenshotAndUpload(type);
      
      if (screenshot) {
        // Get the current count for this type
        const currentCount = cheatingLog[`${type}Count`] || 0;
        
        // Update cheating log with incremented count and new screenshot
        const updatedLog = {
          ...cheatingLog,
          [`${type}Count`]: currentCount + 1,
          screenshots: [...(cheatingLog.screenshots || []), screenshot]
        };

        console.log(`Incrementing ${type}Count from ${currentCount} to ${currentCount + 1}`);
        console.log('Updating cheating log with:', updatedLog);
        updateCheatingLog(updatedLog);
      }

      switch (type) {
        case 'noFace':
          swal('Face Not Visible', 'Warning Recorded', 'warning');
          break;
        case 'multipleFace':
          swal('Multiple Faces Detected', 'Warning Recorded', 'warning');
          break;
        case 'cellPhone':
          swal('Cell Phone Detected', 'Warning Recorded', 'warning');
          break;
        case 'prohibitedObject':
          swal('Prohibited Object Detected', 'Warning Recorded', 'warning');
          break;
        default:
          break;
      }
    }
  };

  const runCoco = async () => {
    try {
      const net = await cocossd.load();
      console.log('AI model loaded.');
      setInterval(() => detect(net), 1000);
    } catch (error) {
      console.error('Error loading model:', error);
      swal('Error', 'Failed to load AI model. Please refresh the page.', 'error');
    }
  };

  const detect = async (net) => {
    if (webcamRef.current && webcamRef.current.video && webcamRef.current.video.readyState === 4) {
      const video = webcamRef.current.video;
      const videoWidth = video.videoWidth;
      const videoHeight = video.videoHeight;

      webcamRef.current.video.width = videoWidth;
      webcamRef.current.video.height = videoHeight;
      canvasRef.current.width = videoWidth;
      canvasRef.current.height = videoHeight;

      try {
        const obj = await net.detect(video);
        const ctx = canvasRef.current.getContext('2d');
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        drawRect(obj, ctx);

        let person_count = 0;
        let faceDetected = false;
        const now = Date.now();

        // Process detections
        obj.forEach((element) => {
          const detectedClass = element.class;
          if (detectedClass === 'person') {
            faceDetected = true;
            person_count++;
          }
        });

        // Check each violation type and update counts
        const checkAndUpdateViolation = async (type, condition, message) => {
          if (isExamTerminated) return false;
          
          if (condition && now - (lastDetectionTime[type] || 0) >= 3000) {
            setLastDetectionTime(prev => ({ ...prev, [type]: now }));
            
            // Increment the count in our ref
            countsRef.current[`${type}Count`]++;
            
            // Calculate total violations
            const totalViolations = Object.values(countsRef.current).reduce((sum, count) => sum + count, 0);
            
            // Create the update object with all current counts
            const updateObj = {
              ...cheatingLog,
              noFaceCount: countsRef.current.noFaceCount,
              multipleFaceCount: countsRef.current.multipleFaceCount,
              cellPhoneCount: countsRef.current.cellPhoneCount,
              prohibitedObjectCount: countsRef.current.prohibitedObjectCount
            };
            
            // Update the cheating log with all current counts
            updateCheatingLog(updateObj);
            
            // Check if total violations have reached 5
            if (totalViolations >= 5 && !isExamTerminated) {
              setIsExamTerminated(true);
              await swal({
                title: "Exam Terminated",
                text: "You have reached 5 violations. The exam will be terminated.",
                icon: "error",
                buttons: {
                  confirm: "OK"
                }
              });
              navigate('/'); // Navigate to home page
              return true;
            }
            
            // Show the warning with current count
            swal(message, `Violation #${countsRef.current[`${type}Count`]} (Total: ${totalViolations}/5)`, 'warning');
            
            return true;
          }
          return false;
        };

        // Check each violation type
        obj.forEach((element) => {
          const detectedClass = element.class;
          
          if (detectedClass === 'cell phone') {
            checkAndUpdateViolation('cellPhone', true, 'Cell Phone Detected');
          }
          
          if (detectedClass === 'book' || detectedClass === 'laptop') {
            checkAndUpdateViolation('prohibitedObject', true, 'Prohibited Object Detected');
          }
        });

        if (person_count > 1) {
          checkAndUpdateViolation('multipleFace', true, 'Multiple Faces Detected');
        }

        if (!faceDetected) {
          checkAndUpdateViolation('noFace', true, 'Face Not Visible');
        }
      } catch (error) {
        console.error('Error during detection:', error);
      }
    }
  };

  useEffect(() => {
    runCoco();
  }, []);

  return (
    <Box>
      <Card variant="outlined" sx={{ position: 'relative', width: '100%', height: '100%' }}>
        <Webcam
          ref={webcamRef}
          audio={false}
          muted
          screenshotFormat="image/jpeg"
          videoConstraints={{
            width: 640,
            height: 480,
            facingMode: 'user',
          }}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 10,
          }}
        />
      </Card>
    </Box>
  );
}

// Helper to convert base64 to File
function dataURLtoFile(dataUrl, fileName) {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) u8arr[n] = bstr.charCodeAt(n);
  return new File([u8arr], fileName, { type: mime });
}
