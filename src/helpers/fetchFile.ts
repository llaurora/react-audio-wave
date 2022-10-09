import EventEmitter from "./eventEmitter";

type ResponseType = "json" | "arraybuffer" | "blob" | "text";

interface FetchRequestInit extends RequestInit {
    responseType: ResponseType;
}

export default function fetchFile(url: string, options?: FetchRequestInit) {
    if (!url) {
        throw new Error("fetch url missing");
    }
    let total = 0;
    let loaded = 0;
    const instance: any = new EventEmitter();
    const fetchHeaders = new Headers();
    const fetchRequest = new Request(url);
    const {
        headers,
        responseType = "arraybuffer",
        method = "GET",
        mode = "cors",
        credentials = "same-origin",
        cache = "default",
        redirect = "follow",
        referrer = "client",
    } = options || {};

    // add ability to abort
    instance.controller = new AbortController();

    // check if headers have to be added
    if (headers) {
        // add custom request headers
        Object.entries(options.headers).forEach(([key, value]) => {
            fetchHeaders.append(key, value);
        });
    }

    // parse fetch options
    const fetchOptions = {
        method,
        mode,
        credentials,
        cache,
        redirect,
        referrer,
        headers: fetchHeaders,
        signal: instance.controller.signal,
    };

    fetch(fetchRequest, fetchOptions)
        .then((response) => {
            let progressAvailable = true;
            if (!response.body) {
                // ReadableStream is not yet supported in this browser
                // see https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream
                progressAvailable = false;
            }

            // Server must send CORS header "Access-Control-Expose-Headers: content-length"
            const contentLength = response.headers.get("content-length");
            total = Number.parseInt(contentLength, 10);
            if (contentLength === null) {
                // Content-Length server response header missing.
                // Don't evaluate download progress if we can't compare against a total size
                // see https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS#Access-Control-Expose-Headers
                progressAvailable = false;
            }

            if (!progressAvailable) {
                // not able to check download progress so skip it
                return response;
            }
            const reader = response.body.getReader();
            return new Response(
                new ReadableStream({
                    start(controller) {
                        // 下面的函数处理每个数据块
                        const push = () => {
                            reader
                                .read()
                                .then(({ done, value }) => {
                                    // done  - true if the stream has already given you all its data.
                                    // value - some data. Always undefined when done is true.
                                    if (done) {
                                        instance.emit("progress", { loaded, total, lengthComputable: false });
                                        // no more data needs to be consumed, close the stream
                                        controller.close();
                                        return;
                                    }

                                    loaded += value.byteLength;
                                    instance.emit("progress", {
                                        loaded,
                                        total,
                                        lengthComputable: !(total === 0),
                                    });
                                    // no more data needs to be consumed, close the stream
                                    controller.enqueue(value);
                                    push();
                                })
                                .catch((error) => {
                                    controller.error(error);
                                });
                        };

                        push();
                    },
                }),
                fetchOptions,
            );
        })
        .then((response) => {
            let errMsg;
            if (response.ok) {
                switch (responseType) {
                    case "arraybuffer":
                        return response.arrayBuffer();
                    case "json":
                        return response.json();
                    case "blob":
                        return response.blob();
                    case "text":
                        return response.text();
                    default:
                        errMsg = `Unknown responseType: ${responseType}`;
                        break;
                }
            }
            if (!errMsg) {
                errMsg = `HTTP error status: ${response.status}`;
            }
            throw new Error(errMsg);
        })
        .then((response) => {
            instance.emit("success", response);
        })
        .catch((error) => {
            instance.emit("error", error);
        });

    // return the fetch request
    instance.fetchRequest = fetchRequest;
    return instance;
}
