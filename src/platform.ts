import { EventEmitter } from 'node:events';

import { API, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig, Service, Characteristic } from 'homebridge';

import { PLATFORM_NAME, PLUGIN_NAME } from './settings.js';
import { TpLinkPowerlinePlatformAccessory } from './platformAccessory.js';

import { TpPlc } from 'node-tp-link-powerline';

interface DeviceConfig {
  mac: string;
  name?: string;
  model?: string;
  serialNumber?: string;
  pollInterval?: number;
}

interface PowerlineDevice {
  name: string;
  mac: string;
  ping(): Promise<boolean>;
}

/**
 * HomebridgePlatform
 * This class is the main constructor for your plugin, this is where you should
 * parse the user config and discover/register accessories with Homebridge.
 */
export class TpLinkPowerlinePlatform implements DynamicPlatformPlugin {
  public readonly Service: typeof Service;
  public readonly Characteristic: typeof Characteristic;

  // this is used to track restored cached accessories
  public readonly accessories: PlatformAccessory[] = [];
  private readonly accessoryControllers = new Map<string, TpLinkPowerlinePlatformAccessory>();

  constructor(
    public readonly log: Logger,
    public readonly config: PlatformConfig,
    public readonly api: API,
  ) {
    this.Service = this.api.hap.Service;
    this.Characteristic = this.api.hap.Characteristic;

    if (!config.devices) {
      config.devices = [];
    }

    config.devices = (config.devices as DeviceConfig[]).filter(deviceConfig => deviceConfig.mac);

    this.log.debug('Finished initializing platform:', this.config.name);

    // When this event is fired it means Homebridge has restored all cached accessories from disk.
    // Dynamic Platform plugins should only register new accessories after this event was fired,
    // in order to ensure they weren't added to homebridge already. This event can also be used
    // to start discovery of new accessories.
    this.api.on('didFinishLaunching', () => {
      log.debug('Executed didFinishLaunching callback');
      this.discoverDevices();
    });

    this.api.on('shutdown', () => {
      for (const controller of this.accessoryControllers.values()) {
        controller.destroy();
      }
      this.accessoryControllers.clear();
    });
  }

  /**
   * This function is invoked when homebridge restores cached accessories from disk at startup.
   * It should be used to setup event handlers for characteristics and update respective values.
   */
  configureAccessory(accessory: PlatformAccessory): void {
    this.log.info('Loading accessory from cache:', accessory.displayName);

    // add the restored accessory to the accessories cache so we can track if it has already been registered
    this.accessories.push(accessory);
  }

  /**
   * Discovers and registers devices found on the local network via node-tp-link-powerline.
   * Devices not present in the user config are logged as warnings.
   */
  discoverDevices(): void {
    const tpPlc = new TpPlc();

    // Prevent unhandled error events from crashing the Node.js process
    (tpPlc as EventEmitter).on('error', (err: Error) => {
      this.log.error('node-tp-link-powerline error:', err.message);
    });

    // the discovered devices - register each one if it has not already been registered
    tpPlc.on('found', (device: PowerlineDevice) => {
      const uuid = this.api.hap.uuid.generate(device.mac);

      const existingAccessory = this.accessories.find(accessory => accessory.UUID === uuid);

      const deviceConfig = (this.config.devices as DeviceConfig[])
        .find(deviceConfig => deviceConfig.mac.toUpperCase() === device.mac.toUpperCase());

      if (!deviceConfig) {
        this.log.warn('Found unconfigured accessory:', device.mac.toUpperCase());
      }

      let name: string = device.name;

      if (deviceConfig && deviceConfig.name) {
        name = deviceConfig.name;
      }

      if (existingAccessory) {
        this.log.info('Restoring existing accessory from cache:', existingAccessory.displayName);

        existingAccessory.context.device = device;
        existingAccessory.context.config = deviceConfig;
        existingAccessory.context.name = name;
        this.api.updatePlatformAccessories([existingAccessory]);

        this.addOrReplaceAccessoryController(existingAccessory);

      } else {
        this.log.info('Adding new accessory:', device.name);

        const accessory = new this.api.platformAccessory(name, uuid);

        accessory.context.device = device;
        accessory.context.config = deviceConfig;
        accessory.context.name = name;

        this.addOrReplaceAccessoryController(accessory);

        this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
      }
    });

    tpPlc.getDevices();
  }

  private addOrReplaceAccessoryController(accessory: PlatformAccessory): void {
    this.accessoryControllers.get(accessory.UUID)?.destroy();
    this.accessoryControllers.set(accessory.UUID, new TpLinkPowerlinePlatformAccessory(this, accessory));
  }
}
