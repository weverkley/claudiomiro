# GLM Integration for Claude Code

This guide explains how to set up and use GLM (Zhipu AI) models with Claude Code.

## Prerequisites

- Claude Code installed and working
- A GLM API key from [Z.AI Console](https://z.ai/)

## Step-by-Step Setup

### 1. Get Your GLM API Key

1. Visit [Z.AI Console](https://z.ai/)
2. Sign up or log in to your account
3. Navigate to API Keys section
4. Create a new API key
5. Copy your API key for the next steps

### 2. Create the GLM Wrapper Script

Run the following command to create the wrapper script:

```bash
cat >/opt/homebrew/bin/glm <<'EOF'
#!/bin/bash
ANTHROPIC_BASE_URL="https://api.z.ai/api/anthropic" ANTHROPIC_AUTH_TOKEN="YOUR-GLM-API-KEY" API_TIMEOUT_MS=600000 ANTHROPIC_MODEL=GLM-4.6 ANTHROPIC_SMALL_FAST_MODEL=GLM-4.5-Air CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1 claude "$@"


EOF

chmod +x /opt/homebrew/bin/glm
```

### 3. Configure Your API Key

**IMPORTANT**: Replace `YOUR-GLM-API-KEY` with your actual GLM API key in the script.

Edit the script file:

```bash
nano /opt/homebrew/bin/glm
```

Find this line:
```bash
ANTHROPIC_AUTH_TOKEN="YOUR-GLM-API-KEY" \
```

Replace `YOUR-GLM-API-KEY` with your actual API key:
```bash
ANTHROPIC_AUTH_TOKEN="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" \
```

### 4. Configure Model Settings (Optional)

The GLM wrapper uses these default models:
- **Main Model**: `GLM-4.6` (for complex tasks)
- **Fast Model**: `GLM-4.5-Air` (for quick operations)

You can customize these by modifying the wrapper script or by editing `~/.claude/settings.json`:

```json
{
  "modelMappings": {
    "ANTHROPIC_DEFAULT_OPUS_MODEL": "GLM-4.6",
    "ANTHROPIC_DEFAULT_SONNET_MODEL": "GLM-4.6",
    "ANTHROPIC_DEFAULT_HAIKU_MODEL": "GLM-4.5-Air"
  }
}
```

## Usage

### Basic Usage

```bash
glm
```

### With Claudiomiro

```bash
claudiomiro --glm
claudiomiro --prompt="Implement user authentication" --glm
```

## Available GLM Models

- **GLM-4.6**: Latest generation model with improved reasoning capabilities
- **GLM-4.5-Air**: Lightweight model optimized for speed and efficiency
- **GLM-4**: Previous generation model (compatible but less powerful)

## Troubleshooting

### Command Not Found
If you get "command not found" after installation:

1. Ensure `/opt/homebrew/bin/` is in your PATH
2. Restart your terminal or run: `source ~/.zshrc` (or `~/.bashrc`)

### API Key Issues
- Verify your GLM API key is correct
- Check that your account has sufficient credits
- Ensure the API key is properly formatted

### Connection Issues
- Check your internet connection
- Verify the GLM API endpoint is accessible
- Check if there are any service outages on [Z.AI Status](https://status.z.ai/)

### Model Compatibility
- Some advanced Claude Code features may behave differently with GLM models
- If you encounter issues, try switching to `GLM-4.6` for better compatibility
- For debugging, you can temporarily use the official Claude client with `claude --claude`

## Performance Tips

1. **Use GLM-4.6** for complex tasks requiring deep reasoning
2. **Use GLM-4.5-Air** for quick tasks and simple operations
3. **Increase timeout** for very long tasks: add `API_TIMEOUT_MS=1200000` (20 minutes)
4. **Monitor usage** in Z.AI console to avoid rate limits

## Notes

- This wrapper uses Claude Code's infrastructure but routes requests to GLM's API
- Most Claude Code features work the same way, though response times and quality may vary
- Environment variables are set only for the execution process, not permanently
- GLM models may have different capabilities compared to Claude models
- Some advanced features like tool use may have limited compatibility

## Examples

### Basic Task
```bash
glm "Create a React component for user profiles"
```

### Complex Development Task
```bash
glm "Implement a complete REST API with authentication, database models, and tests"
```

### With Claudiomiro
```bash
claudiomiro --glm --prompt="Build an e-commerce frontend with React and TypeScript"
```