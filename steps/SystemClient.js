const { createRandomHexString, getCachedBytes } = require("../lib/Units.js");
const Grpc = require("../lib/Grpc.js");

const SystemAuthorizeProto = require("../generated/takasho/schema/lettuce_server/player_api/system_authorize_v1_pb.js");
const DeviceInfoProto = require("../generated/takasho/schema/lettuce_server/resource/system/device_info_pb.js");
const PlatformTypeProto = require("../generated/takasho/schema/lettuce_server/resource/system/platform_type_pb.js");

const SystemLoginProto = require("../generated/takasho/schema/lettuce_server/player_api/system_login_v1_pb.js");
const LanguageProto = require("../generated/takasho/schema/lettuce_server/resource/language/language_pb.js");
const PlayerSettingsInfoProto = require("../generated/takasho/schema/lettuce_server/resource/player_settings/info_pb.js");

/** 取得 sessionToken */
const AuthorizeV1 = async (headers, idToken) => {
  // 建立 Request instance
  const request = new SystemAuthorizeProto.SystemAuthorizeV1.Types.Request();
  request.setIdToken(idToken);
  request.setDeviceAccount(createRandomHexString(32).toUpperCase());

  // 建立 DeviceInfo instance
  const deviceInfo = new DeviceInfoProto.DeviceInfo();
  deviceInfo.setPlatform(PlatformTypeProto.PlatformType.PLATFORM_TYPE_GOOGLE);
  deviceInfo.setIdentifier(createRandomHexString(64));
  request.setDeviceInfo(deviceInfo);

  // 序列化為 byte array（Uint8Array）
  const bytes = request.serializeBinary();

  const result = await Grpc.sendGrpcRequest(
    "System/AuthorizeV1",
    headers,
    bytes
  );

  // 反序列化
  const resultBody =
    SystemAuthorizeProto.SystemAuthorizeV1.Types.Response.deserializeBinary(
      await result.body
    );
  const body = resultBody.toObject();

  return {
    data: body,
    headers: result.headers,
  };
};

/** 登入 */
const LoginV1 = async (headers, language) => {
  const bytes = getCachedBytes(["System/LoginV1", language], () => {
    // 建立 Request instance
    const request = new SystemLoginProto.SystemLoginV1.Types.Request();

    // 設定語言類型
    request.setLanguageType(LanguageProto.Language[language]);

    // 設定第三方數據提供相關設定
    request.setThirdPartyDataProvisionApproved(true);
    request.setThirdPartyDataProvisionVersionApproved("1.0.0");

    // 設定隱私政策和服務條款版本
    request.setPrivacyPolicyConsentVersionApproved("1.0.0");
    request.setTermsOfServiceConsentVersionApproved("1.0.0");

    // 設定國家/地區代碼
    request.setCountryRegionCode("TW");

    // 設定出生年月
    request.setYearNumOfBirth(1988);
    request.setMonthNumOfBirth(1);

    // 設定各種使用設定
    request.setUseOfDataInGameAnnouncements(true);
    request.setUseOfLastLoginTime(true);
    request.setUseOfLoginData(true);
    request.setUseOfPerformanceErrors(true);

    // 設定年齡限制類型
    request.setAgeGateType(
      PlayerSettingsInfoProto.Info.Types.AgeGateType.AGE_GATE_TYPE_A
    );

    // 序列化為 byte array（Uint8Array）
    return request.serializeBinary();
  });
  await Grpc.sendGrpcRequest("System/LoginV1", headers, bytes, false);

  return;
};

module.exports = {
  AuthorizeV1,
  LoginV1,
};
