import os from 'node:os';

function run() {
  console.log(
    `system: ${os.platform()} ${os.arch()} v${os.release()} ${os.cpus().length} cores ${Math.ceil(
      os.totalmem() / 1024 / 1024 / 1024,
    )}GB`,
  );
  console.log(`node: ${process.version} ${process.arch}`);
}

run();
