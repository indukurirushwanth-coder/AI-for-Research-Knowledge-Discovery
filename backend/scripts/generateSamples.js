import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function createPaper1() {
  const pdfDoc = await PDFDocument.create();
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  // --- PAGE 1 ---
  const page1 = pdfDoc.addPage([595, 842]);
  let y = 800;

  page1.drawText('Scalable Quantum Algorithms for Cryptographic Fault Tolerance and Shor Accelerations', {
    x: 50,
    y: y,
    size: 14,
    font: fontBold,
    color: rgb(0.05, 0.1, 0.25)
  });
  y -= 25;

  page1.drawText('Dr. Elena Rostova, Marcus Vance | Quantum Computing Lab, MIT', {
    x: 50,
    y: y,
    size: 10,
    font: fontOblique,
    color: rgb(0.3, 0.35, 0.45)
  });
  y -= 35;

  page1.drawText('Abstract', { x: 50, y: y, size: 12, font: fontBold, color: rgb(0.1, 0.1, 0.2) });
  y -= 18;

  const abstractText = [
    'Recent advancements in superconducting transmon qubits and surface-code error correction have brought fault-tolerant quantum',
    'computation significantly closer to practical realization. In this empirical study, we evaluate circuit synthesis optimization',
    'techniques targeting Shor algorithm subroutines for modular exponentiation. Our optimized synthesis achieves a 42% reduction in',
    'T-gate overhead when operating on logical qubits under rotated planar code topologies. We calculate that breaking standard',
    'RSA-2048 keys requires approximately 20,480 physical qubits operating with gate infidelity below 10^-3 over an estimated',
    'runtime of 8.2 hours. We conclude that current asymmetric infrastructure will experience practical obsolescence by 2035.'
  ];
  for (const line of abstractText) {
    page1.drawText(line, { x: 50, y: y, size: 9, font: fontRegular, color: rgb(0.15, 0.15, 0.15) });
    y -= 14;
  }
  y -= 20;

  page1.drawText('1. Objective and Architecture', { x: 50, y: y, size: 12, font: fontBold, color: rgb(0.1, 0.1, 0.2) });
  y -= 18;

  const introText = [
    'The primary research objective of this paper is to quantify the exact physical qubit and temporal requirements needed to execute',
    'fault-tolerant integer factorization on standard cryptographic modulus lengths. Modern cryptographic security relies heavily',
    'on the computational intractability of integer factorization (RSA) and discrete logarithms (ECC).',
    'Our system architecture models a cryogenic dilution refrigerator system operating at 15 millikelvin, housing planar superconducting',
    'circuits with nearest-neighbor square lattice connectivity. We simulate topological surface codes with code distance d=27.'
  ];
  for (const line of introText) {
    page1.drawText(line, { x: 50, y: y, size: 9, font: fontRegular, color: rgb(0.15, 0.15, 0.15) });
    y -= 14;
  }
  y -= 20;

  page1.drawText('2. Methodology', { x: 50, y: y, size: 12, font: fontBold, color: rgb(0.1, 0.1, 0.2) });
  y -= 18;

  const methodText = [
    'We implemented an end-to-end numerical quantum circuit simulation using Pauli frame tracking and lattice surgery distillation.',
    'Magic state distillation factories were configured for 15-to-1 state preparation protocols. The physical error budget was modeled',
    'using depolarizing quantum channels with physical two-qubit gate fidelities ranging from 99.8% to 99.95%.',
    'Modular exponentiation was compiled through reversible Carry-Ripple and Beauregard arithmetic circuits, minimizing total spatial footprint.'
  ];
  for (const line of methodText) {
    page1.drawText(line, { x: 50, y: y, size: 9, font: fontRegular, color: rgb(0.15, 0.15, 0.15) });
    y -= 14;
  }

  page1.drawText('Page 1 of 2 - ResearchLens AI Sample Archive', { x: 200, y: 30, size: 8, font: fontRegular, color: rgb(0.5, 0.5, 0.5) });

  // --- PAGE 2 ---
  const page2 = pdfDoc.addPage([595, 842]);
  y = 800;

  page2.drawText('3. Key Findings and Numerical Results', { x: 50, y: y, size: 12, font: fontBold, color: rgb(0.1, 0.1, 0.2) });
  y -= 18;

  const findingsText = [
    'Empirical simulation of the distillation factory pipeline produced the following definitive results:',
    '1. T-Gate Complexity: Reduced total non-Clifford T-count from 1.2 x 10^9 to 6.96 x 10^8 gates for 2048-bit factorization.',
    '2. Physical Footprint: Under rotated surface code with d=27, factoring RSA-2048 requires 20,480 physical superconducting qubits.',
    '3. Temporal Bound: The estimated factorization duration on a physical clock cycle of 1 microsecond is 8 hours and 14 minutes.',
    '4. ECC Degradation: Elliptic Curve Cryptography (ECDSA secp256k1) collapses significantly faster, requiring only 3,400 physical qubits',
    '   and approximately 45 minutes of computation.'
  ];
  for (const line of findingsText) {
    page2.drawText(line, { x: 50, y: y, size: 9, font: fontRegular, color: rgb(0.15, 0.15, 0.15) });
    y -= 14;
  }
  y -= 20;

  page2.drawText('4. Limitations', { x: 50, y: y, size: 12, font: fontBold, color: rgb(0.1, 0.1, 0.2) });
  y -= 18;

  const limitsText = [
    'The critical limitations of this work are grounded in current hardware manufacturing ceilings:',
    '- Operating conditions mandate sub-15 millikelvin cryogenic environments, which restrict quantum chip co-location with standard data centers.',
    '- Cosmic ray burst events induce correlated spatio-temporal errors that temporarily overwhelm surface-code decoders.',
    '- The analysis does not account for control line thermal leakage when scaling beyond 5,000 co-planar coaxial cables.'
  ];
  for (const line of limitsText) {
    page2.drawText(line, { x: 50, y: y, size: 9, font: fontRegular, color: rgb(0.15, 0.15, 0.15) });
    y -= 14;
  }
  y -= 20;

  page2.drawText('5. Conclusions and Recommendations', { x: 50, y: y, size: 12, font: fontBold, color: rgb(0.1, 0.1, 0.2) });
  y -= 18;

  const conclusionText = [
    'Our empirical data indicates that classical public key cryptography (RSA and ECC) faces complete existential vulnerability.',
    'Organizations must initiate post-quantum migration immediately, prioritizing lattice-based or hash-based alternatives.',
    'We predict the "Harvest Now, Decrypt Later" threat model poses an acute risk to recorded sovereign communications today.'
  ];
  for (const line of conclusionText) {
    page2.drawText(line, { x: 50, y: y, size: 9, font: fontRegular, color: rgb(0.15, 0.15, 0.15) });
    y -= 14;
  }

  page2.drawText('Page 2 of 2 - ResearchLens AI Sample Archive', { x: 200, y: 30, size: 8, font: fontRegular, color: rgb(0.5, 0.5, 0.5) });

  return pdfDoc.save();
}

async function createPaper2() {
  const pdfDoc = await PDFDocument.create();
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontOblique = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  // --- PAGE 1 ---
  const page1 = pdfDoc.addPage([595, 842]);
  let y = 800;

  page1.drawText('Post-Quantum Lattice-Based Cryptography: Empirical Evaluation of CRYSTALS-Kyber and Dilithium', {
    x: 50,
    y: y,
    size: 13,
    font: fontBold,
    color: rgb(0.05, 0.1, 0.25)
  });
  y -= 25;

  page1.drawText('Prof. David Chen, Sarah Lin | National Cyber Defense Research Center', {
    x: 50,
    y: y,
    size: 10,
    font: fontOblique,
    color: rgb(0.3, 0.35, 0.45)
  });
  y -= 35;

  page1.drawText('Abstract', { x: 50, y: y, size: 12, font: fontBold, color: rgb(0.1, 0.1, 0.2) });
  y -= 18;

  const abstractText = [
    'With NIST finalizing post-quantum cryptography standards, transitioning enterprise networks to lattice-based primitives is',
    'paramount. This paper presents an empirical performance benchmark of CRYSTALS-Kyber key encapsulation and CRYSTALS-Dilithium digital',
    'signatures across heterogeneous server, cloud, and embedded ARM architectures. While Kyber-768 requires 1.8x larger memory',
    'buffers during key generation compared to RSA-2048, it achieves 12.4x faster encapsulation speed and imperviousness to Shor algorithm',
    'attacks. However, public key and ciphertext transmission induces TCP packet fragmentation on legacy networking middleboxes.',
    'We evaluate mitigation strategies and outline deployment guidelines for zero-trust environments.'
  ];
  for (const line of abstractText) {
    page1.drawText(line, { x: 50, y: y, size: 9, font: fontRegular, color: rgb(0.15, 0.15, 0.15) });
    y -= 14;
  }
  y -= 20;

  page1.drawText('1. Objective and Research Scope', { x: 50, y: y, size: 12, font: fontBold, color: rgb(0.1, 0.1, 0.2) });
  y -= 18;

  const introText = [
    'The objective of this research is to measure the actual network throughput, memory overhead, and side-channel resistance of',
    'NIST FIPS 203 (ML-KEM / Kyber) and FIPS 204 (ML-DSA / Dilithium). As organizations respond to quantum decryption threats,',
    'practical adoption hurdles must be separated from theoretical security proofs. We investigate whether lattice-based schemes',
    'can seamlessly replace RSA-2048 and ECDSA without degrading TLS 1.3 handshake latency under real-world congestion.'
  ];
  for (const line of introText) {
    page1.drawText(line, { x: 50, y: y, size: 9, font: fontRegular, color: rgb(0.15, 0.15, 0.15) });
    y -= 14;
  }
  y -= 20;

  page1.drawText('2. Experimental Methodology', { x: 50, y: y, size: 12, font: fontBold, color: rgb(0.1, 0.1, 0.2) });
  y -= 18;

  const methodText = [
    'We executed 500,000 TLS 1.3 handshakes across three target testbeds: Intel Xeon Platinum 8380 server clusters, Raspberry Pi 4 (ARM Cortex-A72),',
    'and STM32 Cortex-M4 microcontrollers with 192 KB RAM. We recorded memory allocation watermarks, CPU clock cycles using RDTSC, and',
    'packet fragmentation rates across simulated WAN links with 40ms round-trip latency and 0.5% packet drop rates.',
    'Constant-time polynomial multiplication was verified using valgrind-based side-channel leakage detection.'
  ];
  for (const line of methodText) {
    page1.drawText(line, { x: 50, y: y, size: 9, font: fontRegular, color: rgb(0.15, 0.15, 0.15) });
    y -= 14;
  }

  page1.drawText('Page 1 of 2 - ResearchLens AI Sample Archive', { x: 200, y: 30, size: 8, font: fontRegular, color: rgb(0.5, 0.5, 0.5) });

  // --- PAGE 2 ---
  const page2 = pdfDoc.addPage([595, 842]);
  y = 800;

  page2.drawText('3. Key Findings and Benchmark Comparison', { x: 50, y: y, size: 12, font: fontBold, color: rgb(0.1, 0.1, 0.2) });
  y -= 18;

  const findingsText = [
    'The experimental benchmark yielded the following critical observations:',
    '1. Computational Speed: Kyber-768 key encapsulation completed in 38.2 microseconds on Intel Xeon, compared to 475 microseconds for RSA-2048,',
    '   yielding an impressive 12.4x speed acceleration.',
    '2. Key and Ciphertext Size: Kyber-768 public keys are 1,184 bytes (versus 256 bytes for RSA-2048 and 64 bytes for ECDSA P-256).',
    '3. Transmission Penalty: In WAN environments, Dilithium-3 signatures (3,293 bytes) triggered IP fragmentation in 14.8% of packets across legacy',
    '   firewalls, causing a 28% increase in tail P99 latency.',
    '4. Agreement with Prior Studies: In strong agreement with quantum threat models, our security verification confirms complete mathematical',
    '   immunity against Shor algorithm attacks based on the Module Learning With Errors (M-LWE) hardness problem.'
  ];
  for (const line of findingsText) {
    page2.drawText(line, { x: 50, y: y, size: 9, font: fontRegular, color: rgb(0.15, 0.15, 0.15) });
    y -= 14;
  }
  y -= 20;

  page2.drawText('4. Limitations and Embedded Device Constraints', { x: 50, y: y, size: 12, font: fontBold, color: rgb(0.1, 0.1, 0.2) });
  y -= 18;

  const limitsText = [
    'We observed several prominent practical limitations:',
    '- On low-power Cortex-M4 IoT microcontrollers, the 1.8x memory footprint expansion caused stack overflows without dedicated RTOS memory tuning.',
    '- Network middlebox packet drop rates remain an unresolved obstacle in enterprise legacy architectures without MTU renegotiation.',
    '- The study did not test resistance against physical electromagnetic fault-injection side channels on unshielded microcontrollers.'
  ];
  for (const line of limitsText) {
    page2.drawText(line, { x: 50, y: y, size: 9, font: fontRegular, color: rgb(0.15, 0.15, 0.15) });
    y -= 14;
  }
  y -= 20;

  page2.drawText('5. Conclusions and Future Research Scope', { x: 50, y: y, size: 12, font: fontBold, color: rgb(0.1, 0.1, 0.2) });
  y -= 18;

  const conclusionText = [
    'We conclude that lattice-based cryptography is completely viable and superior for cloud and enterprise services today.',
    'However, we disagree with proposals advocating mandatory instant adoption across all low-power IoT devices prior to hardware accelerator availability.',
    'Future research must explore hybrid post-quantum schemes combining classical and lattice algorithms, alongside zero-fragmentation packet compression.'
  ];
  for (const line of conclusionText) {
    page2.drawText(line, { x: 50, y: y, size: 9, font: fontRegular, color: rgb(0.15, 0.15, 0.15) });
    y -= 14;
  }

  page2.drawText('Page 2 of 2 - ResearchLens AI Sample Archive', { x: 200, y: 30, size: 8, font: fontRegular, color: rgb(0.5, 0.5, 0.5) });

  return pdfDoc.save();
}

async function main() {
  const samplesDir = path.resolve(__dirname, '../../samples');
  if (!fs.existsSync(samplesDir)) {
    fs.mkdirSync(samplesDir, { recursive: true });
  }

  console.log('Generating genuine research sample PDFs in samples/ ...');
  const paper1 = await createPaper1();
  const file1 = path.join(samplesDir, 'Quantum_Computing_Cryptographic_Breakthroughs.pdf');
  fs.writeFileSync(file1, paper1);
  console.log(`Saved: ${file1} (${paper1.length} bytes)`);

  const paper2 = await createPaper2();
  const file2 = path.join(samplesDir, 'Post_Quantum_Lattice_Cryptography_Standards.pdf');
  fs.writeFileSync(file2, paper2);
  console.log(`Saved: ${file2} (${paper2.length} bytes)`);

  console.log('Sample PDFs ready for research exploration!');
}

main().catch(console.error);
