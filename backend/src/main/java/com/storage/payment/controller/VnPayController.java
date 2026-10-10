package com.storage.payment.controller;

import com.storage.payment.service.VnPayIpnService;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/payments/vnpay")
public class VnPayController {

    private final VnPayIpnService vnPayIpnService;

    public VnPayController(VnPayIpnService vnPayIpnService) {
        this.vnPayIpnService = vnPayIpnService;
    }

    @GetMapping("/ipn")
    public Map<String, String> ipn(@RequestParam Map<String, String> params) {
        return vnPayIpnService.handleIpn(params);
    }
}
