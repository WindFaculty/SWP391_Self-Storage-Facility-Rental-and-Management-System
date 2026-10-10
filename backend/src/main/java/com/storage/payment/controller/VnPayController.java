package com.storage.payment.controller;

import com.storage.payment.service.VnPayIpnService;
import com.storage.payment.service.VnPayService;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/payments/vnpay")
public class VnPayController {

    private final VnPayIpnService vnPayIpnService;
    private final VnPayService vnPayService;

    public VnPayController(VnPayIpnService vnPayIpnService, VnPayService vnPayService) {
        this.vnPayIpnService = vnPayIpnService;
        this.vnPayService = vnPayService;
    }

    @GetMapping("/ipn")
    public Map<String, String> ipn(@RequestParam Map<String, String> params) {
        return vnPayIpnService.handleIpn(params);
    }

    @GetMapping("/return")
    public Map<String, String> returnUrl(@RequestParam Map<String, String> params) {
        Map<String, String> result = new LinkedHashMap<>();
        result.put("txnRef", value(params, "vnp_TxnRef"));
        result.put("responseCode", value(params, "vnp_ResponseCode"));
        result.put("transactionStatus", value(params, "vnp_TransactionStatus"));
        result.put("amount", value(params, "vnp_Amount"));
        result.put("payDate", value(params, "vnp_PayDate"));
        result.put("checksumVerified", String.valueOf(vnPayService.verifyChecksum(params)));
        return result;
    }

    private static String value(Map<String, String> params, String key) {
        String value = params.get(key);
        return value == null ? "" : value;
    }
}
