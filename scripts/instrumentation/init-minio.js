"use server";
import cliColors from "./cli-colors";
import minio from "@/lib/minio";
import { 
  HeadBucketCommand, 
  CreateBucketCommand, 
  PutBucketPolicyCommand,
  GetBucketVersioningCommand,
  PutBucketVersioningCommand
} from "@aws-sdk/client-s3";

const { client, bucketName, endpoint } = minio;

const initMinio = async () => {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    try {
      console.log(`${cliColors.blue}🔧 Initializing MINIO instrumentation...${cliColors.reset}`);
      
      // Check if bucket exists
      let bucketExists = false;
      try {
        await client.send(new HeadBucketCommand({ Bucket: bucketName }));
        bucketExists = true;
        console.log(`${cliColors.green}✓ Bucket '${bucketName}' already exists${cliColors.reset}`);
      } catch (error) {
        if (error.name === "NotFound" || error.name === "NoSuchBucket" || error.$metadata?.httpStatusCode === 404) {
          console.log(`${cliColors.yellow}! Bucket '${bucketName}' does not exist, creating it...${cliColors.reset}`);
          bucketExists = false;
        } else {
          throw error;
        }
      }

      // Create bucket if it doesn't exist
      if (!bucketExists) {
        try {
          await client.send(new CreateBucketCommand({ Bucket: bucketName }));
          console.log(`${cliColors.green}✓ Bucket '${bucketName}' created successfully${cliColors.reset}`);

          // Set bucket policy to allow public read access
          const policy = {
            Version: "2012-10-17",
            Statement: [
              {
                Effect: "Allow",
                Principal: "*",
                Action: ["s3:GetObject"],
                Resource: [`arn:aws:s3:::${bucketName}/*`],
              },
            ],
          };

          await client.send(
            new PutBucketPolicyCommand({
              Bucket: bucketName,
              Policy: JSON.stringify(policy),
            })
          );
          console.log(`${cliColors.green}✓ Bucket policy set for public read access${cliColors.reset}`);
        } catch (createError) {
          console.log(`${cliColors.red}✗ Failed to create bucket '${bucketName}': ${createError.message}${cliColors.reset}`);
          throw createError;
        }
      }

      // Check and disable versioning if enabled
      try {
        console.log(`${cliColors.blue}🔧 Checking bucket versioning...${cliColors.reset}`);
        
        const versioningResponse = await client.send(new GetBucketVersioningCommand({ Bucket: bucketName }));
        const versioningStatus = versioningResponse.Status;
        
        if (versioningStatus === "Enabled") {
          console.log(`${cliColors.yellow}! Bucket versioning is enabled, disabling it...${cliColors.reset}`);
          
          await client.send(new PutBucketVersioningCommand({
            Bucket: bucketName,
            VersioningConfiguration: {
              Status: "Suspended"
            }
          }));
          
          console.log(`${cliColors.green}✓ Bucket versioning disabled successfully${cliColors.reset}`);
        } else if (versioningStatus === "Suspended") {
          console.log(`${cliColors.green}✓ Bucket versioning is already disabled${cliColors.reset}`);
        } else {
          console.log(`${cliColors.green}✓ Bucket versioning is not enabled${cliColors.reset}`);
        }
      } catch (versioningError) {
        console.log(`${cliColors.yellow}! Warning: Could not check/disable versioning: ${versioningError.message}${cliColors.reset}`);
        // Don't throw here as versioning might not be supported in some MinIO setups
      }

      console.log(`${cliColors.green}✓✓ MINIO instrumentation initialized successfully${cliColors.reset}`);
      console.log(`${cliColors.cyan}   Bucket: ${bucketName}${cliColors.reset}`);
      console.log(`${cliColors.cyan}   Endpoint: ${endpoint}${cliColors.reset}`);

      return;
    } catch (error) {
      console.log(`${cliColors.red}✗✗ Error initializing MINIO instrumentation: ${error.message}${cliColors.reset}`);
      console.log(error);
    }
  }
  return;
};

export default initMinio;
