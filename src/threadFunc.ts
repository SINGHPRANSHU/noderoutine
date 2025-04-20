import { Worker, isMainThread, parentPort, workerData} from 'worker_threads';


export function threadFunc<T>(fn: (...args: any) => T, ...args: any): Promise<T> | undefined {
    if (isMainThread) {
        return new Promise((resolve, reject) => {        
        const worker = new Worker(__filename, {
            workerData: {fn: fn.toString(), args},
        });
        worker.on('message', resolve);
        worker.on('error', reject);
        worker.on('exit', (code) => {
            if (code !== 0)
            reject(new Error(`Worker stopped with exit code ${code}`));
        });
        });
        
    }
          
}
 
if (!isMainThread && parentPort) {
    const {fn, args} = workerData;
    const func = eval(fn);    
    parentPort.postMessage(func(...args));
}