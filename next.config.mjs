/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: [
      'chromadb',
      '@chroma-core/default-embed',
      'onnxruntime-node',
      '@huggingface/transformers',
      'sharp',
      'pdf-parse',
    ],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push({
        'onnxruntime-node': 'commonjs onnxruntime-node',
        '@huggingface/transformers': 'commonjs @huggingface/transformers',
        '@chroma-core/default-embed': 'commonjs @chroma-core/default-embed',
        sharp: 'commonjs sharp',
      })
    }
    return config
  },
}

export default nextConfig
