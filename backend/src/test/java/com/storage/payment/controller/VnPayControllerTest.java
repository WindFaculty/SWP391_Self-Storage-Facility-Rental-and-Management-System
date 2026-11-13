package com.storage.payment.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.storage.payment.service.VnPayIpnService;
import com.storage.payment.service.VnPayService;
import java.net.URI;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

@ExtendWith(MockitoExtension.class)
class VnPayControllerTest {

    @Mock
    private VnPayIpnService vnPayIpnService;

    @Mock
    private VnPayService vnPayService;

    @Test
    void doesNotConfirmOnReturnWhenFlagDisabled() {
        VnPayController controller = new VnPayController(
                vnPayIpnService, vnPayService, "http://localhost:5173/payment/result", false);
        Map<String, String> params = Map.of(
                "vnp_TxnRef", "VNPAY-1",
                "vnp_ResponseCode", "00",
                "vnp_TransactionStatus", "00");
        when(vnPayService.verifyChecksum(params)).thenReturn(true);

        ResponseEntity<Void> response = controller.returnUrl(params);

        assertEquals(HttpStatus.SEE_OTHER, response.getStatusCode());
        assertEquals(URI.create(
                "http://localhost:5173/payment/result?vnp_TxnRef=VNPAY-1&vnp_ResponseCode=00&vnp_TransactionStatus=00"),
                response.getHeaders().getLocation());
        verifyNoInteractions(vnPayIpnService);
    }

    @Test
    void confirmsThroughIpnServiceOnVerifiedReturnWhenFlagEnabled() {
        VnPayController controller = new VnPayController(
                vnPayIpnService, vnPayService, "http://localhost:5173/payment/result", true);
        Map<String, String> params = Map.of(
                "vnp_TxnRef", "VNPAY-1",
                "vnp_ResponseCode", "00",
                "vnp_TransactionStatus", "00");
        when(vnPayService.verifyChecksum(params)).thenReturn(true);

        ResponseEntity<Void> response = controller.returnUrl(params);

        assertEquals(HttpStatus.SEE_OTHER, response.getStatusCode());
        verify(vnPayIpnService).handleIpn(params);
    }

    @Test
    void skipsConfirmationWhenReturnChecksumInvalidEvenIfFlagEnabled() {
        VnPayController controller = new VnPayController(
                vnPayIpnService, vnPayService, "http://localhost:5173/payment/result", true);
        Map<String, String> params = Map.of("vnp_TxnRef", "VNPAY-1", "vnp_ResponseCode", "00");
        when(vnPayService.verifyChecksum(params)).thenReturn(false);

        ResponseEntity<Void> response = controller.returnUrl(params);

        assertEquals(HttpStatus.SEE_OTHER, response.getStatusCode());
        assertEquals(URI.create("http://localhost:5173/payment/result?vnp_TxnRef=VNPAY-1&returnVerified=false"),
                response.getHeaders().getLocation());
        verifyNoInteractions(vnPayIpnService);
    }
}
