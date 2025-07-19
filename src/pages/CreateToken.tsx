return (
  <div className="p-6 max-w-xl mx-auto space-y-6 transition-all duration-500 ease-in-out">
    <div className="flex justify-between items-center">
      <h1 className="text-2xl font-bold">Step {currentStep + 1}: {steps[currentStep]}</h1>
      <button onClick={resetFlow} className="text-xs underline text-red-500">Reset</button>
    </div>

    <div className="flex space-x-1 mb-4">
      {steps.map((_, i) => (
        <div
          key={i}
          className={`h-2 w-full rounded-full transition-all duration-300 ${
            i === currentStep ? 'bg-yellow-400 animate-pulse' :
            i < currentStep ? 'bg-green-500' : 'bg-gray-300'
          }`}
        />
      ))}
    </div>

    {info && <p className="text-sm bg-gray-100 p-2 rounded animate-fade-in transition-opacity duration-300">{info}</p>}
    {error && <p className="text-red-600 text-sm animate-fade-in transition-opacity duration-300">Error: {error}</p>}

    <div className="flex space-x-4">
      <button
        onClick={goBack}
        disabled={currentStep === 0 || loading}
        className="px-4 py-2 bg-gray-500 text-white rounded disabled:opacity-50"
      >
        ⬅ Back
      </button>

      {currentStep === 0 ? (
        <button
          onClick={generateMintKeypair}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500"
        >
          🔐 Generate Mint Keypair
        </button>
      ) : (
        <button
          onClick={runStep}
          disabled={!publicKey || loading || currentStep >= steps.length}
          className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 disabled:opacity-50"
        >
          {loading ? 'Processing...' : currentStep >= steps.length ? 'All Done' : 'Next Step ➡️'}
        </button>
      )}
    </div>

    {txSignature && (
      <div className="text-green-600 text-sm break-words">
        <p>{txSignature}</p>
        <a
          href={`https://explorer.solana.com/address/${mint!.publicKey.toBase58()}?cluster=mainnet`}
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          View on Solana Explorer
        </a>
      </div>
    )}

    <div className="bg-black text-white text-xs p-3 rounded mt-4 max-h-48 overflow-y-auto font-mono">
      <p className="mb-1 font-bold text-green-400">🪵 Transaction Log</p>
      <p>{info}</p>
      {error && <p className="text-red-400 mt-2">{error}</p>}
    </div>
  </div>
);
