import { Box, Center, VStack } from "@chakra-ui/react";
import { Footer } from "./components/footer";
import ReactMarkdown from "react-markdown";
import { Header } from "./components/header";

export function PrivacyPolicy() {
  return (
    <Center>
      <VStack>
        <Box maxWidth="48em" padding="2em" minHeight="85vh">
          <Header />
          <ReactMarkdown>
            {`# Privacy Policy for Lil Pitch

**Effective Date:** 16th November 2025

This Privacy Policy describes how Lil Pitch ("we," "us," or "our") handles information when you use our website and AI agent service (the "Service").

Our core philosophy is to collect the absolute minimum data required to provide our Service.

### 1. Information We Collect

We do not require user accounts, and we do not collect personal information like your name or email address. The information we process is limited to:

* **Contextual Information:** You provide text-based context for your practice session, such as your role, the interviewer's persona, and any additional notes. This information is used only to set up the AI agent for your session and is not stored after the session.
* **Call Transcripts:** To provide the AI agent's functionality, your voice is processed by our third-party partner, **Vapi**, to generate transcripts. These **call transcripts** and **audio files** are the only data we store after your session is complete.

### 2. How We Use Your Information

We use the information we collect for one purpose: **to provide and operate the Service.**

Your contextual information is used to configure the AI agent for your session. Your call transcripts are stored to operate, maintain, and improve the service.

### 3. Data Sharing and Third Parties

We do not sell, trade, or rent your information to any third parties for marketing purposes.

* **Vapi (Voice AI Provider):** Our Service is built using Vapi. Your voice data is streamed to Vapi to be transcribed and to generate an AI response. Vapi processes this data as a necessary function of the Service.
* **Other Data:** We do not store any other personal data, so there is nothing else to share.

### 4. Data Storage and Retention

We are a minimal-data service. We do not store your personal information.

The only data we retain are the **call transcripts** generated from your sessions. We retain this data for a limited period to operate and maintain the service, after which it will be deleted.

### 5. Changes to This Policy

We may update this Privacy Policy from time to time. Any changes will be posted on this page.

### 6. Contact Us

If you have any questions about this Privacy Policy, please contact us at:

**elias@brickwiseai.com**`}
          </ReactMarkdown>
        </Box>
        <Footer />
      </VStack>
    </Center>
  );
}
