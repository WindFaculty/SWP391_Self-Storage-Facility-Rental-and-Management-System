package com.storage.shared.exception;

import org.springframework.http.HttpStatus;

public enum ErrorCode {
    BAD_REQUEST("BAD_REQUEST", "Yêu cầu không hợp lệ", HttpStatus.BAD_REQUEST),
    VALIDATION_ERROR("VALIDATION_ERROR", "Dữ liệu đầu vào không hợp lệ", HttpStatus.BAD_REQUEST),

    UNAUTHORIZED("UNAUTHORIZED", "Yêu cầu xác thực tài khoản", HttpStatus.UNAUTHORIZED),
    INVALID_CREDENTIALS("INVALID_CREDENTIALS", "Email hoặc mật khẩu không chính xác", HttpStatus.UNAUTHORIZED),
    INVALID_TOKEN("INVALID_TOKEN", "Token không hợp lệ hoặc đã hết hạn", HttpStatus.UNAUTHORIZED),

    FORBIDDEN("FORBIDDEN", "Bạn không có quyền thực hiện hành động này", HttpStatus.FORBIDDEN),
    USER_INACTIVE("USER_INACTIVE", "Tài khoản đã bị vô hiệu hóa", HttpStatus.FORBIDDEN),

    NOT_FOUND("NOT_FOUND", "Không tìm thấy tài nguyên yêu cầu", HttpStatus.NOT_FOUND),
    USER_NOT_FOUND("USER_NOT_FOUND", "Người dùng không tồn tại", HttpStatus.NOT_FOUND),
    FACILITY_NOT_FOUND("FACILITY_NOT_FOUND", "Không tìm thấy cơ sở kho", HttpStatus.NOT_FOUND),
    UNIT_TYPE_NOT_FOUND("UNIT_TYPE_NOT_FOUND", "Không tìm thấy loại kho", HttpStatus.NOT_FOUND),
    STORAGE_UNIT_NOT_FOUND("STORAGE_UNIT_NOT_FOUND", "Không tìm thấy đơn vị kho", HttpStatus.NOT_FOUND),
    INVOICE_NOT_FOUND("INVOICE_NOT_FOUND", "Không tìm thấy hóa đơn", HttpStatus.NOT_FOUND),
    RENTAL_NOT_FOUND("RENTAL_NOT_FOUND", "Không tìm thấy hợp đồng thuê", HttpStatus.NOT_FOUND),

    INVALID_UNIT_STATUS_TRANSITION("INVALID_UNIT_STATUS_TRANSITION", "Chuyển trạng thái kho không hợp lệ", HttpStatus.BAD_REQUEST),

    FACILITY_CODE_EXISTS("FACILITY_CODE_EXISTS", "Mã cơ sở kho đã tồn tại", HttpStatus.CONFLICT),
    UNIT_TYPE_NAME_EXISTS("UNIT_TYPE_NAME_EXISTS", "Tên loại kho đã tồn tại", HttpStatus.CONFLICT),
    STORAGE_UNIT_CODE_EXISTS("STORAGE_UNIT_CODE_EXISTS", "Mã đơn vị kho đã tồn tại trong cơ sở", HttpStatus.CONFLICT),

    EMAIL_ALREADY_EXISTS("EMAIL_ALREADY_EXISTS", "Email đã tồn tại trong hệ thống", HttpStatus.CONFLICT),

    INTERNAL_SERVER_ERROR("INTERNAL_SERVER_ERROR", "Lỗi xử lý máy chủ nội bộ", HttpStatus.INTERNAL_SERVER_ERROR);

    private final String code;
    private final String defaultMessage;
    private final HttpStatus httpStatus;

    ErrorCode(String code, String defaultMessage, HttpStatus httpStatus) {
        this.code = code;
        this.defaultMessage = defaultMessage;
        this.httpStatus = httpStatus;
    }

    public String getCode() {
        return code;
    }

    public String getDefaultMessage() {
        return defaultMessage;
    }

    public HttpStatus getHttpStatus() {
        return httpStatus;
    }
}
