/**
 * This Api class lets you define an API endpoint and methods to request
 * data and process it.
 *
 * See the [Backend API Integration](https://docs.infinite.red/ignite-cli/boilerplate/app/services/#backend-api-integration)
 * documentation for more details.
 */
import axios, { AxiosInstance, AxiosError } from "axios"

import Config from "@/config"

import type { ApiConfig } from "./types"

/**
 * Configuring the axios instance.
 */
export const DEFAULT_API_CONFIG: ApiConfig = {
  url: Config.API_URL,
  timeout: 90000,
}

/**
 * Manages all requests to the API. You can use this class to build out
 * various requests that you need to call from your backend API.
 */
export class Api {
  axios: AxiosInstance
  config: ApiConfig

  /**
   * Set up our API instance. Keep this lightweight!
   */
  constructor(config: ApiConfig = DEFAULT_API_CONFIG) {
    this.config = config
    this.axios = axios.create({
      baseURL: this.config.url,
      timeout: this.config.timeout,
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
      },
    })

    this.setupInterceptors()
  }

  /**
   * Setup request and response interceptors
   */
  private setupInterceptors() {
    // Request interceptor
    this.axios.interceptors.request.use(
      (config) => {
        return config
      },
      (error) => {
        return Promise.reject(error)
      },
    )

    // Response interceptor
    this.axios.interceptors.response.use(
      (response) => {
        return response
      },
      (error: AxiosError) => {
        const { response } = error

        if (!response) {
          console.error("Connect to server failed. Please check your internet connection.")
          return Promise.reject(error)
        }

        switch (response.status) {
          case 400:
            // Bad Request
            console.error((response.data as any)?.message || "Invalid data!")
            break

          case 401:
            // Unauthorized
            console.error("Session expired. Please log in again!")
          // Remove token and redirect to login page

          case 403:
            // Forbidden
            console.error("You do not have permission to perform this action!")
            break

          case 404:
            // Not Found
            console.error("Resource not found!")
            break

          case 422:
            // Validation Error
            const errors = (response.data as any)?.errors
            if (errors) {
              Object.keys(errors).forEach((key) => {
                console.error(`${key}: ${errors[key].join(", ")}`)
              })
            } else {
              console.error((response.data as any)?.message || "Invalid data!")
            }
            break

          case 429:
            // Too Many Requests
            console.warn("You have sent too many requests. Please try again later!")
            break

          case 500:
            // Internal Server Error
            console.error("Server error! Please try again later.")
            break

          case 502:
          case 503:
          case 504:
            // Bad Gateway, Service Unavailable, Gateway Timeout
            console.error("Server is under maintenance. Please try again later!")
            break

          default:
            // Other errors
            console.error((response.data as any)?.message || "An error occurred. Please try again!")
        }

        // Log error for debug (only in development mode)
        if (process.env.NODE_ENV === "development") {
          console.error("API Error:", {
            url: response.config.url,
            status: response.status,
            data: response.data,
          })
        }

        return Promise.reject(error)
      },
    )
  }
}

export const api = new Api()
