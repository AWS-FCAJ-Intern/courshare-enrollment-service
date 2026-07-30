export const swaggerDocument = {
  openapi: "3.0.0",
  info: {
    title: "CourShare Enrollment Service API",
    version: "1.0.0",
    description: "Tài liệu API cho dịch vụ Đăng ký học phần (Enrollment Service) của hệ thống CourShare."
  },
  servers: [
    {
      url: "http://localhost:8084",
      description: "Local Development Server"
    }
  ],
  components: {
    schemas: {
      Enrollment: {
        type: "object",
        properties: {
          id: {
            type: "string",
            format: "uuid",
            example: "123e4567-e89b-12d3-a456-426614174000"
          },
          userId: {
            type: "string",
            example: "user-12345"
          },
          courseId: {
            type: "string",
            example: "course-67890"
          },
          enrolledAt: {
            type: "string",
            format: "date-time",
            example: "2026-07-20T01:10:22.000Z"
          }
        }
      },
      ErrorResponse: {
        type: "object",
        properties: {
          message: {
            type: "string",
            example: "Error message detail"
          },
          error: {
            type: "string",
            example: "Database connection failed"
          }
        }
      }
    },
    parameters: {
      UserIdHeader: {
        name: "x-user-id",
        in: "header",
        required: true,
        description: "ID của người dùng thực hiện yêu cầu",
        schema: {
          type: "string",
          example: "user_2a1b3c"
        }
      }
    }
  },
  paths: {
    "/": {
      get: {
        summary: "Kiểm tra trạng thái hoạt động (Health Check)",
        tags: ["Health"],
        responses: {
          "200": {
            description: "Dịch vụ đang hoạt động bình thường",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    service: {
                      type: "string",
                      example: "enrollment-service"
                    },
                    status: {
                      type: "string",
                      example: "UP"
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/enrollments": {
      post: {
        summary: "Đăng ký học phần (Course Registration)",
        tags: ["Enrollments"],
        parameters: [
          {
            $ref: "#/components/parameters/UserIdHeader"
          }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["courseId"],
                properties: {
                  courseId: {
                    type: "string",
                    example: "course-67890"
                  }
                }
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Đăng ký thành công",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: {
                      type: "string",
                      example: "Subject registered successfully"
                    },
                    data: {
                      $ref: "#/components/schemas/Enrollment"
                    }
                  }
                }
              }
            }
          },
          "400": {
            description: "Yêu cầu không hợp lệ (thiếu userId trong header hoặc thiếu courseId trong body)",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: {
                      type: "string",
                      example: "User ID is required"
                    }
                  }
                }
              }
            }
          },
          "500": {
            description: "Lỗi hệ thống khi đăng ký",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse"
                }
              }
            }
          }
        }
      }
    },
    "/enrollments/me": {
      get: {
        summary: "Lấy tất cả các học phần đã đăng ký của người dùng",
        tags: ["Enrollments"],
        parameters: [
          {
            $ref: "#/components/parameters/UserIdHeader"
          }
        ],
        responses: {
          "200": {
            description: "Lấy danh sách thành công",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: {
                      type: "string",
                      example: "Enrollments found"
                    },
                    data: {
                      type: "array",
                      items: {
                        $ref: "#/components/schemas/Enrollment"
                      }
                    }
                  }
                }
              }
            }
          },
          "400": {
            description: "Yêu cầu không hợp lệ (thiếu userId)",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: {
                      type: "string",
                      example: "User ID is required in the headers"
                    }
                  }
                }
              }
            }
          },
          "404": {
            description: "Không tìm thấy học phần nào được đăng ký",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: {
                      type: "string",
                      example: "No enrollments found for this user"
                    }
                  }
                }
              }
            }
          },
          "500": {
            description: "Lỗi hệ thống khi truy vấn danh sách",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse"
                }
              }
            }
          }
        }
      }
    },
    "/enrollments/{courseId}/check": {
      get: {
        summary: "Kiểm tra xem người dùng đã đăng ký học phần này chưa",
        tags: ["Enrollments"],
        parameters: [
          {
            $ref: "#/components/parameters/UserIdHeader"
          },
          {
            name: "courseId",
            in: "path",
            required: true,
            description: "ID của học phần cần kiểm tra",
            schema: {
              type: "string",
              example: "course-67890"
            }
          }
        ],
        responses: {
          "200": {
            description: "Lấy thông tin trạng thái thành công",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: {
                      type: "string",
                      example: "Enrollment status fetched"
                    },
                    enrolled: {
                      type: "object",
                      properties: {
                        isEnrolled: {
                          type: "boolean",
                          example: true
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          "400": {
            description: "Yêu cầu không hợp lệ (thiếu userId trong header hoặc thiếu courseId ở path)",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: {
                      type: "string",
                      example: "User ID is required in the headers"
                    }
                  }
                }
              }
            }
          },
          "500": {
            description: "Lỗi hệ thống khi kiểm tra",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse"
                }
              }
            }
          }
        }
      }
    }
  }
};
