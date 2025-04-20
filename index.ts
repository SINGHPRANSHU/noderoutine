import { threadFunc } from "./src/threadFunc";


interface IChannel<T> {
    send: (value: T) => void;
    receive: () => AsyncGenerator<ChannelReciverValue<T>>;
    close: () => void;
}

interface ChannelReciverValue<T> {
    data?: T;
    ok: boolean;
}


class Channel<T> implements IChannel<T> {
    private queue: T[];
    private closed: boolean;
    constructor() {
        this.queue = [];
        this.closed = false;
    }
    send(args: any) {
        if (this.closed) {
            throw new Error('Channel is closed');
        }
        this.queue.push(args);
    }

    private async timeout() {
        return new Promise((res, rej) => {
            setTimeout(() => {
                res(true);
            }, 1000);
        })
    }

    async *receive(): AsyncGenerator<ChannelReciverValue<T>> {
        while(true) {
            if (this.queue.length > 0) {
                yield {   
                    data: this.queue.shift(),
                    ok: true
                }
            }
            if (this.closed) {
                yield {
                    ok: false
                }
                break
            }
            await this.timeout()
        }
    }

    close() {
        this.closed = true;
    }

    isClosed() {
        return this.closed;
    }


    
}


// similar functionality as goroutine
export class NodeRoutine<T> {
    private ch: Channel<T>;

    constructor() {
        this.ch = new Channel<T>();
    }

    getChannel(): Channel<T> {
        return this.ch;
    }

    async run(fn : (...args: any) => any, ...args: any): Promise<void> {                
        const returnedValue = await threadFunc(fn,...args);
        
        if (returnedValue) {
            this.ch.send(returnedValue);
        }
    }
}

const routine = new NodeRoutine<number>();
const ch = routine.getChannel();


routine.run((a, b) => a+ b, 1, 2)




async function ger() {
    let reciever = ch.receive()
    let val = await reciever.next();
    setTimeout(() => {
        ch.close()
    }, 10000);
    while (!val.done) {
        console.log(val.value);
        val = await reciever.next();
        
    }
}
ger()

  
