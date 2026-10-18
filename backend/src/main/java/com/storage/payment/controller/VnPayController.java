package com.storage.payment.controller;

import com.storage.payment.service.VnPayIpnService;
import com.storage.payment.service.VnPayService;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.util.UriComponentsBuilder;

@RestController
@RequestMapping("/payments/vnpay")
public class VnPayController {

    private final VnPayIpnService vnPayIpnService;
    private final VnPayService vnPayService;
    private final String frontendReturnUrl;

    public VnPayController(VnPayIpnService vnPayIpnService, VnPayService vnPayService,
                           @Value("${vnpay.frontend-return-url:http://localhost:5173/payment/result}")
                           String frontendReturnUrl) {
        this.vnPayIpnService = vnPayIpnService;
        this.vnPayService = vnPayService;
        this.frontendReturnUrl = frontendReturnUrl;
    }

    @GetMapping("/ipn")
    public Map<String, String> ipn(@RequestParam Map<String, String> params) {
        return vnPayIpnService.handleIpn(params);
    }

    @GetMapping("/return")
    public ResponseEntity<Void> returnUrl(@RequestParam Map<String, String> params) {
        boolean verified = vnPayService.verifyChecksum(params);
        UriComponentsBuilder redirect = UriComponentsBuilder.fromUriString(frontendReturnUrl);

        String txnRef = params.get("vnp_TxnRef");
        if (StringUtils.hasText(txnRef)) {
            redirect.queryParam("vnp_TxnRef", txnRef);
        }
        if (verified) {
            String responseCode = params.get("vnp_ResponseCode");
            String transactionStatus = params.get("vnp_TransactionStatus");
            if (StringUtils.hasText(responseCode)) {
                redirect.queryParam("vnp_ResponseCode", responseCode);
            }
            if (StringUtils.hasText(transactionStatus)) {
                redirect.queryParam("vnp_TransactionStatus", transactionStatus);
            }
        } else {
            redirect.queryParam("returnVerified", false);
        }

        return ResponseEntity.status(HttpStatus.SEE_OTHER)
                .location(redirect.build().encode().toUri())
                .build();
    }
}
