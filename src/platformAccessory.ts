import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';

import { TpLinkPowerlinePlatform } from './platform.js';

/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers.
 * Each accessory may expose multiple services of different service types.
 */
export class TpLinkPowerlinePlatformAccessory {
  private service: Service;
  private intervalId: ReturnType<typeof setInterval> | undefined;
  private lastStatus: CharacteristicValue;

  constructor(
    private readonly platform: TpLinkPowerlinePlatform,
    private readonly accessory: PlatformAccessory,
  ) {
    // Initialise cached status to UNKNOWN so the first poll sets the real value
    this.lastStatus = this.platform.Characteristic.WiFiSatelliteStatus.UNKNOWN;

    // set accessory information
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'TP-Link')
      .setCharacteristic(this.platform.Characteristic.ProductData, accessory.context.device.mac);

    if (accessory.context.config) {
      if (accessory.context.config.model) {
        this.accessory.getService(this.platform.Service.AccessoryInformation)!
          .setCharacteristic(this.platform.Characteristic.Model, accessory.context.config.model);
      }

      if (accessory.context.config.serialNumber) {
        this.accessory.getService(this.platform.Service.AccessoryInformation)!
          .setCharacteristic(this.platform.Characteristic.SerialNumber, accessory.context.config.serialNumber);
      }
    }

    this.accessory.category = this.platform.api.hap.Categories.RANGE_EXTENDER;

    // get the WiFi Satellite service if it exists, otherwise create a new WiFi Satellite service
    this.service = this.accessory.getService(this.platform.Service.WiFiSatellite) ||
      this.accessory.addService(this.platform.Service.WiFiSatellite);

    this.service.setCharacteristic(this.platform.Characteristic.Name, accessory.context.name);

    // getStatus returns the cached value to avoid concurrent pings with the poller
    this.service.getCharacteristic(this.platform.Characteristic.WiFiSatelliteStatus)
      .onGet(this.getStatus.bind(this));

    // Read poll interval from config (default 10000 ms, minimum 1000 ms)
    const pollInterval: number = Math.max(
      1000,
      (accessory.context.config?.pollInterval as number | undefined) ?? 10000,
    );

    // Poll the device on a configurable interval and push status updates to HomeKit.
    // The interval ID is stored so it can be cleared in destroy().
    this.intervalId = setInterval(async () => {
      try {
        const ping = await accessory.context.device.ping();
        this.lastStatus = ping
          ? this.platform.Characteristic.WiFiSatelliteStatus.CONNECTED
          : this.platform.Characteristic.WiFiSatelliteStatus.NOT_CONNECTED;

        this.platform.log.debug('Polling status:', ping ? 'Connected' : 'Not Connected');
      } catch (error) {
        this.platform.log.error('Poll error:', error instanceof Error ? error.message : String(error));
        this.lastStatus = this.platform.Characteristic.WiFiSatelliteStatus.NOT_CONNECTED;
      }

      this.service.updateCharacteristic(this.platform.Characteristic.WiFiSatelliteStatus, this.lastStatus);
    }, pollInterval);
  }

  /**
   * Call when the accessory is removed from Homebridge to prevent interval leaks.
   */
  destroy(): void {
    if (this.intervalId !== undefined) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
      this.platform.log.debug('Cleared polling interval for:', this.accessory.displayName);
    }
  }

  /**
   * Handle GET requests from HomeKit.
   * Returns the last cached status immediately to avoid HomeKit timeouts.
   * The poller keeps the cached value up to date.
   */
  async getStatus(): Promise<CharacteristicValue> {
    this.platform.log.debug('Get Status (cached) ->', this.lastStatus);
    return this.lastStatus;
  }

}
