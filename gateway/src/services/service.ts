import {createResponse, IResponse} from "../utils/utilities";
import {STATUS_CODES} from "../utils/constants";

export abstract class ServiceProvider {
    protected name: string;
    protected code: string;
    protected username: string;
    protected password: string;
    protected secret_key: string;
    protected serverUrl: string;
    protected namespaces: {};
    protected secondaryNamespaces: {};
    protected type: string[];
    protected msisdn: string;
    protected requestPaymentUrl: string;
    protected payoutUrl: string;
    protected billerCode: string;
    protected clientId: string;
    protected payoutPhone: string;
    protected payoutPhonePin: string | number;
    protected dbSecretKey: string;
    protected requestCallback: boolean = false;
    protected requestPayoutCallback: boolean = false;
    protected apiKey: string;
    protected allowedCallbackIPs: string[];
    protected ip: string;
    protected port: number;
    protected agentCode: string;
    protected authKey: string;
    protected pin: string;
    protected extcode: string;
    protected urlQueryString: string;

    protected apiUser: string;
    protected collectionSubscriptionKey: string;
    protected payoutSubscriptionKey: string;
    protected providerCallbackUrl: string;

    getName(): string {
        return this.name;
    }

    getType(): string[] {
        return this.type;
    }

    async checkBalance(accountNumber?: string): Promise<IResponse> {
        return createResponse(STATUS_CODES.BAD_REQUEST);
    }

    async collect(details: any, callback?: any): Promise<IResponse> {
        return createResponse(STATUS_CODES.BAD_REQUEST);
    }

    async transfer(details: any, callback?: any): Promise<IResponse> {
        return createResponse(STATUS_CODES.BAD_REQUEST);
    }

    async transactionCallback(req: any): Promise<IResponse> {
        return createResponse(STATUS_CODES.BAD_REQUEST);
    }

    async sendSms(details: any): Promise<IResponse> {
        return createResponse(STATUS_CODES.BAD_REQUEST);
    }

    async smsSend(details: any): Promise<IResponse> {
        return createResponse(STATUS_CODES.BAD_REQUEST);
    }

    async checkApiStatus(details: any, callback?: any): Promise<IResponse> {
        return createResponse(STATUS_CODES.BAD_REQUEST);
    }

    async checkTransactionStatus(details: any, callback?: any): Promise<IResponse> {
        return createResponse(STATUS_CODES.BAD_REQUEST);
    }

    requestWithCallback() {
        return this.requestCallback;
    }

    requestWithPayoutCallback() {
        return this.requestPayoutCallback;
    }
}