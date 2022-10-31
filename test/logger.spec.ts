import {JLogger} from '@fp8proj/logger';
import {LogDestinations} from '@fp8proj/writer';
import {AbstractLogDestination, AbstractAsyncLogDestination, IJLogEntry} from '@fp8proj/core';


class TestDestination extends AbstractLogDestination {
    write(entry: IJLogEntry): void {
        console.log('### ', JSON.stringify(entry));
    }
}

class TestAsyncDestination extends AbstractAsyncLogDestination {
    async write(entry: IJLogEntry): Promise<void> {
        return new Promise((resolve, _) => {
            setTimeout(() => {
                console.log('--- ', JSON.stringify(entry));
                resolve();
            }, 500);
        });
    }
}



describe.only('logger', () => {
    const dest = LogDestinations.getInstance();
    const logger = new JLogger('test-logger');

    beforeEach(() => {
        dest.clearDestinatios();
    });

    it('info log', () => {
        dest.addDestination(new TestDestination());
        logger.info('Hello')
    });

    it('info async log', async () => {
        dest.addDestination(new TestAsyncDestination());
        logger.info('Hello Async')
        await logger.waitCurrentWrite();
        console.log('done');
    });
});
