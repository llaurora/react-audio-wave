type EventHandler = (...args: any[]) => void;

export default class EventEmitter {
    #emiter = new Map<string, EventHandler[]>();

    public on(topic: string, ...handlers: EventHandler[]) {
        let topics = this.#emiter.get(topic);
        if (!topics) {
            this.#emiter.set(topic, (topics = []));
        }
        topics.push(...handlers);
    }

    public off(topic: string, handler?: EventHandler): boolean {
        if (!handler) {
            return this.#emiter.delete(topic);
        }
        const topics = this.#emiter.get(topic);
        if (!topics) {
            return false;
        }
        const index = topics.indexOf(handler);
        if (index < 0) {
            return false;
        }
        topics.splice(index, 1);
        if (topics.length === 0) {
            this.#emiter.delete(topic);
        }
        return true;
    }

    public emit(topic: string, ...args: any[]): any[] | null {
        const topics = this.#emiter.get(topic);
        if (!topics) {
            return;
        }
        topics.forEach((handler: EventHandler) => {
            try {
                handler(...args);
            } catch (error) {
                console.log(error);
            }
        });
    }
}
