"use client";

import { useState } from "react";
import { saveImages } from "@/data/dal/shop/file-system/image-actions";
import { Button } from "@/components/ui/button";

export default function TestServerAction() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [diagnosticInfo, setDiagnosticInfo] = useState(null);
  const [diagnosticLoading, setDiagnosticLoading] = useState(false);
  const [directTestResult, setDirectTestResult] = useState(null);
  const [directTestLoading, setDirectTestLoading] = useState(false);
  const [envVars, setEnvVars] = useState(null);
  const [envLoading, setEnvLoading] = useState(false);
  const [pingResult, setPingResult] = useState(null);
  const [pingLoading, setPingLoading] = useState(false);
  const [bucketSetupResult, setBucketSetupResult] = useState(null);
  const [bucketSetupLoading, setBucketSetupLoading] = useState(false);
  const [simpleUploadResult, setSimpleUploadResult] = useState(null);
  const [simpleUploadLoading, setSimpleUploadLoading] = useState(false);
  const [debugUploadResult, setDebugUploadResult] = useState(null);
  const [debugUploadLoading, setDebugUploadLoading] = useState(false);
  const [dockerStatus, setDockerStatus] = useState(null);
  const [dockerLoading, setDockerLoading] = useState(false);

  const testServerAction = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log("Calling test server action");

      // Create a simple test image
      const base64Image =
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==";

      const timestamp = Date.now();
      const testImageName = `test-image-${timestamp}.png`;
      const testImagePath = `products/1000005/${testImageName}`;

      // Call the server action with minimal data
      const result = await saveImages({
        product_id: 1000005, // Use a valid product ID
        images: [
          {
            base64: base64Image,
            name: testImageName,
            mime_type: "image/png",
            size: 1000,
            selected: true,
            // Removed path and key to test proper generation by saveImages
          },
        ],
        created_by: null,
      });

      console.log("Test server action result:", result);
      setResult(result);
    } catch (err) {
      console.error("Error in test server action:", err);
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const runDiagnostics = async () => {
    setDiagnosticLoading(true);
    try {
      const response = await fetch("/api/minio/diagnostic");
      if (!response.ok) {
        throw new Error(`Diagnostic API failed: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      setDiagnosticInfo(data);
    } catch (err) {
      console.error("Error running diagnostics:", err);
      setError(`Diagnostic error: ${err.message}`);
    } finally {
      setDiagnosticLoading(false);
    }
  };

  const runDirectTest = async () => {
    setDirectTestLoading(true);
    try {
      const response = await fetch("/api/minio/direct-test");
      if (!response.ok) {
        throw new Error(`Direct test API failed: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      setDirectTestResult(data);
    } catch (err) {
      console.error("Error running direct test:", err);
      setError(`Direct test error: ${err.message}`);
    } finally {
      setDirectTestLoading(false);
    }
  };

  const checkEnvVars = async () => {
    setEnvLoading(true);
    try {
      const response = await fetch("/api/env");
      if (!response.ok) {
        throw new Error(`Environment API failed: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      setEnvVars(data);
    } catch (err) {
      console.error("Error checking environment variables:", err);
      setError(`Environment check error: ${err.message}`);
    } finally {
      setEnvLoading(false);
    }
  };

  const pingMinio = async () => {
    setPingLoading(true);
    try {
      const response = await fetch("/api/minio/ping");
      if (!response.ok) {
        throw new Error(`Ping API failed: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      setPingResult(data);
    } catch (err) {
      console.error("Error pinging Minio:", err);
      setError(`Minio ping error: ${err.message}`);
    } finally {
      setPingLoading(false);
    }
  };

  const setupBucket = async () => {
    setBucketSetupLoading(true);
    try {
      const response = await fetch("/api/minio/setup-bucket");
      if (!response.ok) {
        throw new Error(`Bucket setup API failed: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      setBucketSetupResult(data);
    } catch (err) {
      console.error("Error setting up bucket:", err);
      setError(`Bucket setup error: ${err.message}`);
    } finally {
      setBucketSetupLoading(false);
    }
  };

  const runSimpleUploadTest = async () => {
    setSimpleUploadLoading(true);
    try {
      const response = await fetch("/api/minio/simple-upload-test");
      if (!response.ok) {
        throw new Error(`Simple upload test failed: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      setSimpleUploadResult(data);
    } catch (err) {
      console.error("Error in simple upload test:", err);
      setError(`Simple upload test error: ${err.message}`);
    } finally {
      setSimpleUploadLoading(false);
    }
  };

  const runDebugUploadTest = async () => {
    setDebugUploadLoading(true);
    try {
      const response = await fetch("/api/minio/debug-upload");
      if (!response.ok) {
        throw new Error(`Debug upload test failed: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      setDebugUploadResult(data);
    } catch (err) {
      console.error("Error in debug upload test:", err);
      setError(`Debug upload test error: ${err.message}`);
    } finally {
      setDebugUploadLoading(false);
    }
  };

  const checkDockerStatus = async () => {
    setDockerLoading(true);
    try {
      const response = await fetch("/api/docker/status");
      if (!response.ok) {
        throw new Error(`Docker status check failed: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      setDockerStatus(data);
    } catch (err) {
      console.error("Error checking Docker status:", err);
      setError(`Docker status check error: ${err.message}`);
    } finally {
      setDockerLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="font-medium mb-2">Minio Integration Diagnostics</h3>

      <div className="flex flex-wrap gap-2 mb-4">
        <Button onClick={testServerAction} disabled={loading}>
          {loading ? "Testing..." : "Test saveImages Server Action"}
        </Button>

        <Button onClick={runDiagnostics} disabled={diagnosticLoading} variant="outline">
          {diagnosticLoading ? "Running..." : "Run Minio Diagnostics"}
        </Button>

        <Button onClick={runDirectTest} disabled={directTestLoading} variant="outline">
          {directTestLoading ? "Testing..." : "Direct Minio Upload Test"}
        </Button>

        <Button onClick={checkEnvVars} disabled={envLoading} variant="outline">
          {envLoading ? "Checking..." : "Check Environment Variables"}
        </Button>

        <Button onClick={pingMinio} disabled={pingLoading} variant="outline">
          {pingLoading ? "Pinging..." : "Ping Minio Server"}
        </Button>

        <Button onClick={() => window.open("http://localhost:9001", "_blank")} variant="secondary">
          Open Minio Admin Console
        </Button>

        <Button onClick={setupBucket} disabled={bucketSetupLoading} variant="secondary">
          {bucketSetupLoading ? "Setting up..." : "Setup Bucket & Permissions"}
        </Button>

        <Button onClick={runSimpleUploadTest} disabled={simpleUploadLoading} variant="secondary">
          {simpleUploadLoading ? "Testing..." : "Simple Upload Test"}
        </Button>

        <Button onClick={runDebugUploadTest} disabled={debugUploadLoading} variant="secondary">
          {debugUploadLoading ? "Debugging..." : "Debug Image Upload"}
        </Button>

        <Button onClick={checkDockerStatus} disabled={dockerLoading} variant="secondary">
          {dockerLoading ? "Checking..." : "Check Docker Status"}
        </Button>
      </div>

      {error && (
        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
          <strong>Error:</strong> {error}
        </div>
      )}

      {result && (
        <div className="mt-3">
          <h4 className="font-medium mb-1">Server Action Result</h4>
          <pre className="p-2 bg-gray-50 border rounded text-sm overflow-auto max-h-48">{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}

      {directTestResult && (
        <div className="mt-3">
          <h4 className="font-medium mb-1">Direct Minio Upload Test Result</h4>
          <pre className="p-2 bg-gray-50 border rounded text-sm overflow-auto max-h-48">{JSON.stringify(directTestResult, null, 2)}</pre>
        </div>
      )}

      {envVars && (
        <div className="mt-3">
          <h4 className="font-medium mb-1">Environment Variables</h4>
          <pre className="p-2 bg-gray-50 border rounded text-sm overflow-auto max-h-48">{JSON.stringify(envVars, null, 2)}</pre>
        </div>
      )}

      {pingResult && (
        <div className="mt-3">
          <h4 className="font-medium mb-1">Minio Server Ping Result</h4>
          <pre className="p-2 bg-gray-50 border rounded text-sm overflow-auto max-h-48">{JSON.stringify(pingResult, null, 2)}</pre>
        </div>
      )}

      {bucketSetupResult && (
        <div className="mt-3">
          <h4 className="font-medium mb-1">Bucket Setup Result</h4>
          <div
            className={`p-2 ${
              bucketSetupResult.success ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
            } border rounded text-sm`}
          >
            <p className={bucketSetupResult.success ? "text-green-700" : "text-red-700"}>
              {bucketSetupResult.success ? "✓ " : "✗ "}
              {bucketSetupResult.message || bucketSetupResult.error}
            </p>
            {bucketSetupResult.success && (
              <div className="mt-2">
                <p>
                  <strong>Bucket URL:</strong> {bucketSetupResult.bucketUrl}
                </p>
                <p className="mt-1">
                  <strong>Policy:</strong>
                </p>
                <pre className="p-1 bg-gray-50 border rounded text-xs mt-1 overflow-auto max-h-24">
                  {JSON.stringify(bucketSetupResult.policy, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      {simpleUploadResult && (
        <div className="mt-3">
          <h4 className="font-medium mb-1">Simple Upload Test</h4>
          <div
            className={`p-2 ${
              simpleUploadResult.success ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
            } border rounded text-sm`}
          >
            <p className={simpleUploadResult.success ? "text-green-700" : "text-red-700"}>
              {simpleUploadResult.success ? "✓ " : "✗ "}
              {simpleUploadResult.message || simpleUploadResult.error}
            </p>
            {simpleUploadResult.success && (
              <div className="mt-2">
                <p>
                  <strong>File URL:</strong>{" "}
                  <a href={simpleUploadResult.file.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                    {simpleUploadResult.file.url}
                  </a>
                </p>
                <p className="mt-1">
                  <strong>File Content:</strong> {simpleUploadResult.file.content}
                </p>
                <p className="mt-1">
                  <strong>Upload Time:</strong> {simpleUploadResult.file.uploadTime}
                </p>
              </div>
            )}
            {!simpleUploadResult.success && (
              <pre className="p-1 bg-red-50 border border-red-200 rounded text-xs mt-1 overflow-auto max-h-24">
                {JSON.stringify(simpleUploadResult, null, 2)}
              </pre>
            )}
          </div>
        </div>
      )}

      {dockerStatus && (
        <div className="mt-3">
          <h4 className="font-medium mb-1">Docker Status</h4>
          <div className="p-2 bg-gray-50 border rounded text-sm">
            <div className="flex items-center mb-2">
              <span className={`mr-2 ${dockerStatus.success ? "text-green-700" : "text-red-700"} text-lg`}>
                {dockerStatus.success ? "✓" : "✗"}
              </span>
              <span className="font-medium">Docker Check: {dockerStatus.success ? "Success" : "Failed"}</span>
            </div>

            {dockerStatus.minioContainer ? (
              <div className="mt-2">
                <h5 className="font-medium text-sm mb-1">Minio Container</h5>
                <div className="p-1 bg-white border rounded text-xs">
                  <p>
                    <strong>ID:</strong> {dockerStatus.minioContainer.id?.substring(0, 12)}
                  </p>
                  <p>
                    <strong>Name:</strong> {dockerStatus.minioContainer.name}
                  </p>
                  <p>
                    <strong>Image:</strong> {dockerStatus.minioContainer.image}
                  </p>
                  <p>
                    <strong>State:</strong>
                    <span className={dockerStatus.minioContainer.state?.Running ? "text-green-700" : "text-red-700"}>
                      {dockerStatus.minioContainer.state?.Status}
                    </span>
                  </p>
                </div>

                {dockerStatus.minioLogs && (
                  <div className="mt-2">
                    <h5 className="font-medium text-sm mb-1">Minio Container Logs</h5>
                    <pre className="p-1 bg-black text-green-400 border rounded text-xs overflow-auto max-h-32">
                      {dockerStatus.minioLogs}
                    </pre>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-amber-600">No Minio container found</p>
            )}

            <div className="mt-2">
              <h5 className="font-medium text-sm mb-1">All Docker Containers</h5>
              <pre className="p-1 bg-black text-white border rounded text-xs overflow-auto max-h-32">{dockerStatus.containers}</pre>
            </div>
          </div>
        </div>
      )}

      {debugUploadResult && (
        <div className="mt-3">
          <h4 className="font-medium mb-1">Image Upload Debug Results</h4>
          <div
            className={`p-2 ${
              debugUploadResult.success ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
            } border rounded text-sm`}
          >
            <div className="flex items-center mb-2">
              <span className={`mr-2 ${debugUploadResult.success ? "text-green-700" : "text-red-700"} text-lg`}>
                {debugUploadResult.success ? "✓" : "✗"}
              </span>
              <span className="font-medium">Overall Status: {debugUploadResult.success ? "Success" : "Failed"}</span>
            </div>

            {debugUploadResult.steps && (
              <div className="space-y-3">
                <div>
                  <h5 className="font-medium text-sm mb-1">1. Base64 Parsing</h5>
                  <div className="p-1 bg-gray-50 border rounded">
                    <p>
                      Status:
                      <span className={debugUploadResult.steps.base64Parse?.success ? "text-green-700" : "text-red-700"}>
                        {debugUploadResult.steps.base64Parse?.success ? " Success" : " Failed"}
                      </span>
                    </p>
                    {debugUploadResult.steps.base64Parse?.success && (
                      <p className="text-xs mt-1">MIME Type: {debugUploadResult.steps.base64Parse?.mimeType}</p>
                    )}
                  </div>
                </div>

                <div>
                  <h5 className="font-medium text-sm mb-1">2. Buffer Creation</h5>
                  <div className="p-1 bg-gray-50 border rounded">
                    <p>
                      Status:
                      <span className={debugUploadResult.steps.buffer?.success ? "text-green-700" : "text-red-700"}>
                        {debugUploadResult.steps.buffer?.success ? " Success" : " Failed"}
                      </span>
                    </p>
                    {debugUploadResult.steps.buffer?.success && (
                      <p className="text-xs mt-1">Size: {debugUploadResult.steps.buffer?.length} bytes</p>
                    )}
                  </div>
                </div>

                <div>
                  <h5 className="font-medium text-sm mb-1">3. File Path Generation</h5>
                  <div className="p-1 bg-gray-50 border rounded">
                    <p>Path: {debugUploadResult.steps.filepath?.path}</p>
                  </div>
                </div>

                <div>
                  <h5 className="font-medium text-sm mb-1">4. Upload to Minio</h5>
                  <div className="p-1 bg-gray-50 border rounded">
                    <p>
                      Status:
                      <span className={debugUploadResult.steps.upload?.success ? "text-green-700" : "text-red-700"}>
                        {debugUploadResult.steps.upload?.success ? " Success" : " Failed"}
                      </span>
                    </p>
                    {debugUploadResult.steps.upload?.success ? (
                      <div className="text-xs mt-1">
                        <p>
                          URL:{" "}
                          <a
                            href={debugUploadResult.steps.upload.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 underline"
                          >
                            {debugUploadResult.steps.upload.url}
                          </a>
                        </p>
                        <p>Key: {debugUploadResult.steps.upload.key}</p>
                      </div>
                    ) : (
                      <pre className="text-xs mt-1 p-1 bg-red-50 border border-red-200 overflow-auto max-h-24">
                        {JSON.stringify(debugUploadResult.steps.upload?.error || debugUploadResult.steps.upload, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              </div>
            )}

            {!debugUploadResult.success && !debugUploadResult.steps && (
              <pre className="p-1 bg-red-50 border border-red-200 rounded text-xs mt-1 overflow-auto max-h-24">
                {JSON.stringify(debugUploadResult, null, 2)}
              </pre>
            )}
          </div>
        </div>
      )}

      {diagnosticInfo && (
        <div className="mt-4">
          <h4 className="font-medium mb-1">Minio Diagnostic Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h5 className="text-sm font-medium">Environment</h5>
              <pre className="p-2 bg-gray-50 border rounded text-sm overflow-auto max-h-48">
                {JSON.stringify(diagnosticInfo.environment, null, 2)}
              </pre>
            </div>
            <div>
              <h5 className="text-sm font-medium">Bucket Status</h5>
              <div className="p-2 bg-gray-50 border rounded text-sm">
                <p>
                  Bucket Exists:{" "}
                  <span className={diagnosticInfo.bucketExists ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                    {diagnosticInfo.bucketExists ? "✓ Yes" : "✗ No"}
                  </span>
                </p>

                {diagnosticInfo.bucketError && (
                  <div className="mt-2">
                    <p className="text-red-600">Error accessing bucket:</p>
                    <pre className="bg-red-50 p-1 mt-1 text-xs overflow-auto">{JSON.stringify(diagnosticInfo.bucketError, null, 2)}</pre>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h5 className="text-sm font-medium">Test Upload</h5>
              <div className="p-2 bg-gray-50 border rounded text-sm">
                <p>
                  Status:{" "}
                  <span className={diagnosticInfo.testUpload?.success ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                    {diagnosticInfo.testUpload?.success ? "✓ Success" : "✗ Failed"}
                  </span>
                </p>

                {diagnosticInfo.testUpload?.success ? (
                  <div className="mt-1">
                    <p>File: {diagnosticInfo.testUpload.key}</p>
                    <p className="text-xs mt-1">
                      <a href={diagnosticInfo.testUpload.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                        View uploaded file
                      </a>
                    </p>
                  </div>
                ) : (
                  <div className="mt-2">
                    <p className="text-red-600">Upload error:</p>
                    <pre className="bg-red-50 p-1 mt-1 text-xs overflow-auto">
                      {JSON.stringify(diagnosticInfo.testUpload?.error, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h5 className="text-sm font-medium">Bucket Contents (Up to 10 files)</h5>
              <div className="p-2 bg-gray-50 border rounded text-sm overflow-auto max-h-48">
                {diagnosticInfo.bucketContents?.length > 0 ? (
                  <ul className="text-xs space-y-1">
                    {diagnosticInfo.bucketContents.map((item, index) => (
                      <li key={index}>
                        {item.key} ({Math.round(item.size / 1024)}KB)
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500">No files found in bucket</p>
                )}

                {diagnosticInfo.listError && (
                  <div className="mt-2">
                    <p className="text-red-600">Error listing bucket contents:</p>
                    <pre className="bg-red-50 p-1 mt-1 text-xs">{JSON.stringify(diagnosticInfo.listError, null, 2)}</pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
