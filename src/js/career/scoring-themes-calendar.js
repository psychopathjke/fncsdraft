/*@@PART js/career/scoring-themes-calendar.js@@*/
/* CUP ROUNDS begin — tools/build-cup-rounds.js */
const CC_CUP_ROUNDS={"S11_TwitchRivalsCS":1,"S11_WinterRoyale_Mobile":1,"S11_WinterRoyale_Console":1,"S11_WinterRoyale_PC":1,"S11_WR_ScoringTest":1,"S11_TwitchTesting":1,"S11_FNCS_Finals":2,"S11_DreamhackWinter_BYOC":2,"S11_CC_Contenders":1,"S11_FNCS_Week3":2,"S11_PlatformCup_Mobile":1,"S11_FNCS_Week4":2,"S11_FNCS_Week1":2,"S11_FNF":1,"S11_FNCS_Week2":2,"S11_HypeNight":1,"S11_FNCS_Warmup":2,"S11_PlatformCup_Console":1,"S10_FNCS_Finals":2,"PrivateCompTest":2,"S11_PlatformCup_PC":1,"S10_FNCS_Week5":2,"S10_FNCS_Week4":2,"S10_CC_Contenders":1,"S10_CC_Champions":1,"S10_FNCS_Week3":2,"S10_FNCS_Week2":2,"ONSITE_WorldCup_Solos":1,"S10_FNCS_Week1":2,"S10_CC_Trios":1,"ONSITE_WorldCup_Duos":1,"ONSITE_WorldCup_ProAm":1,"ONSITE_Worldcup_Creative":2,"XboxCup_Solo1":1,"OnlineOpen_Week10":1,"CashCup_Trios2":2,"OnlineOpen_Week9":1,"CashCup_Trios1":1,"OnlineOpen_Week7":1,"OnlineOpen_Week6":1,"OnlineOpen_Week8":1,"OnlineOpen_Week5":1,"OnlineOpen_Week4":1,"JaymeeTesting_Solo":1,"OnlineOpen_Week3":1,"OnlineOpen_Week2":1,"WorldCupWarmup":1,"OnlineOpen_Week1":1,"LuxeCup":1,"BlackheartCup":1,"ScallywagCup":1,"GauntletTest_Duo_Finals":2,"GauntletTest_Solo_Finals":2,"GauntletTest_Solo":1,"ShareTheLove_Champion_Duo":2,"GauntletTest_Duo":2,"ShareTheLove_Prospect_Duo":1,"ShareTheLove_Champion_Solo":2,"ShareTheLove_Contender_Duo":1,"ShareTheLove_Open_Duo":1,"ShareTheLove_Contender_Solo":1,"ShareTheLove_Placement_Duo":2,"ArchitectPopUpSoloEU":1,"ShareTheLove_Placement_Solo":2,"ArchitectPopUpSquadEU":1,"ShareTheLove_Prospect_Solo":1,"ShareTheLove_Open_Solo":1,"TriosOneDayCup1EU":2,"ArchitectPopUpDuoEU":1,"S15_Dreamhack_December":2,"S14_EUEncore":2,"S15_BhangraBoogieCup":1,"S15_PSGenerationsCup":1,"S14_MarvelSuperCup":2,"S15_FrostyFrenzy":2,"S14_VenomCup":2,"S14_Dreamhack_November":2,"S14_BlackWidowCup":1,"S14_LachlanPickaxeFrenzy":1,"S14_GhostRiderCup":1,"S14_FNCS_Finals":2,"S14_Dreamhack_October":2,"S14_FNCS_Qualifier3":2,"S14_CC_Champions":1,"S14_FNCS_Qualifier2":2,"S14_WildWednesday":1,"S14_FNCS_Qualifier1":2,"S14_DaredevilCup":1,"S14_FNCS_Warmup":2,"S14_CC_Platform":1,"S14_Dreamhack_September":2,"S14_HypeNite":1,"S14_CC_Contenders":1,"S13_LlobetiTriosCup":2,"S14_SolidGoldTest":1,"S13":2,"S13_Dreamhack_August":2,"S14_Season4HypeCup":1,"S13_FNCS":2,"S13_FreeFortniteCup":1,"S13_RaiseTheCup":1,"S13_BlueFlatline_EUNAE_Contender":1,"S13_TwoPlayersOneConsole":1,"S13_CC_Champions":1,"S13_AquaNyhroxThrowbackCup":1,"S13_CC_Contenders":1,"S13_CC_Platform":1,"S13_DailyHypeCup":1,"S13_DailyTrios":1,"S13_BughaThrowbackCup":1,"S13_DoigCupTrios":2,"S13_GalaxyCupSolo":1,"S13_Dreamhack_July":2,"S13_MongraalSoloCup":2,"S13_LTMTests":1,"S13_MrSavageTriosCup":2,"S13_HypeNight":1,"S13_HypeNight_Plus":1,"S13_AmarTriosCup":2,"S13_JacobSoloCup":1,"S13_TelefonicaTest":1,"S12_DoigbyCup":1,"S12_CCV2_Platform":2,"S12_BenjyFishyCup_Round2":2,"S12_FNCS_Invitational":1,"S12_TestEvent_SBMM_Test":1,"S12_BenjyFishyCup_Round1":1,"S12_RegistrationTestEvent_Ewron":1,"S12_CCV2_Contenders":2,"S12_InvitedPerfTest":1,"S12_CC_TestFormat2":2,"S12_CC_TestFormat1":2,"S12_FNCS_Finals_Console":2,"S12_FNCS_Finals_PC":2,"S12_FNCS_Week4":2,"S12_PiazzDuos":1,"S12_FNCS_Week3":2,"S12_DailyDuos":1,"S12_OperationKnockout":1,"S12_HypeNight":1,"S12_CC_Platform":1,"S12_CC_Contenders":1,"S12_FNCS_Week2":2,"S12_FNCS_Week1":2,"S12_FNCS_Warmup":2,"S12":1,"S12_limitedTest":1,"S11_CelebrationCup":1,"SourDropper_LoveAndWar":1,"SourDropper_WeekendTournament_Day2":1,"SourDropper_WeekendTournament_Day1":1,"CelebrationCup_Test":1,"S18_GrandRoyale_VictoryPath":2,"S18_GrandRoyale_Finals":2,"S18_GrandRoyaleCommunityCup":1,"S18_ConsoleChampionsCup":2,"S18_CashCupExtraDH":2,"S18_GrandRoyale_Load":1,"S18_GrandRoyale_Reload":2,"S18_CashCup":1,"S18_TriosHypeCup":1,"S18_SoloCashCup":1,"S18_PlaystationCup":2,"S18_BlueCheese_Quick_Cup_Trios":1,"S18_FNCS_SemiFinals_Day2":2,"S18_DuosHypeCup":1,"S18_SoloTestEvent":2,"S18_FNCS_SemiFinals_Day1":2,"S18_FNCS_Finals":2,"S18_FNCS_Qualifier2":2,"S18_BlueCheese_Quick_Cup_Solo":1,"S18_FNCS_Qualifier1":2,"S18_Dreamhack_October":2,"S17_FNCS_Finals":2,"S18_BlueCheese":2,"S18_BlueCheese_Solo":2,"S18_PreseasonWarmup":2,"S18_FloorRestoresLTM":1,"S17_FNCS_RebootRound":1,"S17_GalaxyCup":1,"S17_FNCS_SemiFinals":2,"S17_FNCS_Qualifier3":2,"S17_Dreamhack_August":2,"S17_FNCS_Qualifier2":2,"S17_ZoneWarsLTM":1,"S17_JBalvinCup":1,"S17_SuperKnockBackLTM":1,"S17_WonderWomanCup":1,"S17_GamoraCup":1,"S17_CammyCup":1,"S17_SoloCashCup":1,"S17_FNCS_Qualifier1":2,"S17_CashCup":1,"S17_HypeCup":1,"S17_CashCupExtraDH":1,"S17_BlueCheese":2,"S17_ConsoleChampionsCup":2,"S17_OneShotLTM":1,"S17_PickaxeFrenzyLTM":1,"S17_FNCS_SoloFinals":1,"S17_FloorIsLavaSoloLTM":1,"S17_FNCS_SoloPlayIns":2,"S16_UEFA_Euro_Cup_2020":1,"S16_FNCS_RebootRound":1,"S16_FNCS_Finals":2,"S17_ThanosCup":1,"S16_FNCS_SemiFinals":2,"S16_Dreamhack_April":1,"S16_DeathstrokeCup":1,"S16_FNCS_Qualifier3":2,"S16_ConsoleChampionsCup":2,"S16_EliteScrims":1,"S16_TeenTitansCup":1,"S16_CashCup":1,"S16_OneShotLTM":1,"S16_CashCupExtraDH":1,"S16_OpenScrims":1,"S16_HypeCup":1,"S16_SoloCashCup":1,"S16_FNCS_Qualifier2":2,"S16_FNCS_Qualifier1":2,"S16_CloseEncountersLTM":1,"S16_NeymarJrCup":1,"S16_HighExplosivesLTM":1,"S16_AloyCup":1,"S16_FridayNiteBraggingRights":1,"S16_FloorIsLavaSoloLTM":1,"S16_SpringBreakoutCup":1,"S15_FNCS_GrandFinals":2,"S15_FNCS_RebootRound":1,"S15_FNCS_SemiFinals":2,"S15_TrinityCup":1,"S15_FNCS_Qualifier3":2,"S15_SwitchCup3":1,"S15_LazarAndFreshSuperKnockback":1,"S15_CyprusCup":1,"S15_FloorIsLavaLTM":1,"S15_SolidGoldLTM":1,"S15_FNCS_Qualifier2":2,"S15_CashCupTestWeek":1,"FreeForAllArenaTest_S16_Solo":2,"S15_FNCS_Qualifier1":2,"S15_FridayNiteBraggingRightsTestWeek":1,"S15_SoloCashCupTestWeek":1,"S15_RagsToRichesLTM":1,"S15_SoloCashCup":1,"S15_HeartsWildCup":1,"S15_HypeCup":1,"S15_FridayNiteBraggingRights":1,"S15_FlashCup":1,"S15_Dreamhack_January":2,"S15_CashCup":1,"S15_ASRomaCup":1,"S15_ACMilanCup":1,"S15_OneShotLTM":1,"S15_InterMilanCup":1,"S23_ZBMQuickCupFill":1,"S23_PlacementCup":1,"S15_FazeCityCup":1,"S23_Lettuce":1,"S22_PlaystationCupNov":1,"S15_PeleCup":1,"S15_GrefGSquads":1,"S22_ConsoleChampionsCup":2,"S22_Invitational":1,"S15_GrefGSolo":1,"S22_DivisionalCups_Elite_Finals":1,"S22_FNCSInvitationalCommunityCup":1,"S22_PoloStadiumCup":1,"S22_PlaystationCupOct":1,"S22_ZBMCashCup":1,"S22_LGSoloQuickTest_public":1,"S22_DivisionalCups_Challenger":1,"S22_ZBMQuickCup":1,"S22_DivisionalCups_Elite":1,"S22_PlacementCup":2,"S22_PlaystationCupSep":1,"S22_QueasyCup":2,"S22_DivisionalCups_Contender":1,"S22_SypherPKIconCup":1,"S22_Moneywars_Test1":1,"S21_LGSolosQuickCup_BR":1,"S21_LGSoloCashCup":2,"S21_LGSolosQuickCup_ME":1,"S21_LGTriosCashCup":2,"S21_PlaystationCupAug":1,"S21_LGSolosQuickCup":1,"S21_LGTriosQuickCup":1,"S21_LCTargetPracticeDuos":1,"S21_ConsoleChampionsCup":2,"S21_DreamerCup":1,"S21_LGSoloQuickCup":1,"S21_QuarterbackCup":1,"S21_ConsoleChampionsCupZBM":2,"S21_PgodCup":2,"S21_LCHotDropDuos":1,"S21_TournamentOfPower":1,"S21_FNCS_Finals":2,"S21_LCWildStormDuos":1,"S21_DuosHypeCup_Open":1,"S21_DuosHypeCup_Contender":1,"S21_LCNoSweatSquadsZBM":1,"S21_LCNoSweatDuos":1,"S21_LCNoSweatSolo":1,"S21_FNCS_SemiFinals":2,"S21_LCNoSweatTrios":1,"S21_PlaystationCupJuly":1,"S21_FNCS_Qualifier3":2,"S21_FNCS_Qualifier1":2,"S21_LCStartingLoadoutDuos":1,"S21_GalaxyCup":1,"S21_FNCS_Qualifier2":2,"S21_LCArchitectSolo":1,"S21_LCStartingLoadoutSolo":1,"S21_JewelRush":1,"S21_Whiplash_Test1":1,"S21_SoloCashCupConsole":2,"S21_SoloCashCup":2,"S21_DuosCashCup":2,"S21_SoloHypeCup_Open":1,"S21_SoloHypeCup_Contender":1,"S21_Moneywars_Test1":1,"S21_2v2_Test1":1,"S21_TriosCashCupZBM":2,"S21_TriosQuickCashCup":1,"S21_LCElimOnlyHighScoreZBMSquads":1,"S21_LCElimOnlyHighScoreDuos":1,"S21_PlaystationCupJune":2,"S21_DreamhackSummerZBM":2,"S21_DreamhackSummer":2,"S21_LCQuickCupTriosZBM":2,"S21_SommersetCup":1,"S21_LCQuickCup":2,"S20_ConsoleChampionsCup":2,"S20_LCElimOnlySolo":1,"S20_LCElimOnlyDuos":1,"S20_LCMicroSessionsTriosZBM":2,"S20_PlaystationCupMay":2,"S20_FNCS_Finals":2,"S21_SuperHypeCup":2,"S20_LCMicroSessionsDuos":2,"S20_FNCS_SemiFinals":2,"S20_LCStartingLoadoutDuos":1,"S20_FNCSCommunityCup":1,"S20_FNCS_Qualifier3":2,"S20_LCStartingLoadoutSolos":1,"S20_LCArchitectDuos":1,"s20_LCArchitectSolos":1,"S20_ObiWanCup":1,"S20_FNCS_Qualifier2":2,"S20_AliaACup":1,"S20_LCElegantWeaponsDuos":1,"S20_FNCS_Qualifier1":2,"S20_DuosCashCup":2,"s20_FridayNightZeroBuild":1,"S20_ChicaCup":1,"S20_TriosHypeCup_Champion":1,"S20_DuosHypeCup_Contender":2,"S20_TriosHypeCup_Contender":1,"S20_DuosHypeCup_Open":2,"s20_TriosHypeCup_Open":1,"S20_SoloHypeCup_Open":2,"S20_SoloCashCup":2,"S20_SoloHypeCup_Contender":2,"S20_AndroidStreetFighterCup":1,"S20_LCSuperBlitzDuos":1,"S20_LCNoBuildDuos":1,"S20_StreetFighterCup":1,"S20_LCElimOnlyHighScoreDuos":2,"S20_TwovTwoGlobalTest":1,"S20_PlaystationCupApril_Round1":1,"S20_LCElimOnlyHighScoreTrios":2,"S19_ConsoleChampionsCup":2,"S20_TwovTwo":1,"S20_ChloeKimCup":1,"S19_LCHighScore":1,"S19_LCBestOf":1,"S19_FNCS_Finals":2,"S19_FNCS_SemiFinals":2,"S19_PlaystationCupMarch":1,"S20_LCNoBuildSquads":1,"S19_FNCS_Qualifier2":2,"S19_ThriveCup":1,"S19_FNCSCommunityCup":1,"S19_FNCS_Qualifier1":2,"S19_SoloHypeCup_Open":2,"S19_SoloCashCup":2,"S19_PlaystationCup":2,"S19_SoloHypeCup_Contender":2,"S19_SilkSonicCup":1,"S19_TriosHypeCup_Champion":1,"S19_TriosHypeCup_Contender":1,"S19_DuosCashCup":2,"S19_DuosHypeCup_Contender":2,"S19_TriosHypeCup_Open":1,"S28_MixUpMondaysZB":1,"S19_DuosHypeCup_Open":2,"S28_MixUpMondaysBR":1,"S28_PerformanceEvaluation":2,"S19_AllValleyCup":1,"S28_ConsoleCashCups":2,"S28_DuosCashCup":2,"S28_ConsoleCashCupsZB":2,"S28_DuosZBVictoryCashCup":2,"S28_PlaystationCupDecember":1,"S27_SoloVictoryCashCup":2,"S28_SoloVictoryCashCup":2,"S28_PlaystationCupZBDecember":1,"S27_DuosZBVictoryCashCup":2,"S27_RankedCupZBPlatinumSquads":1,"S27_RankedCupPlatinumSquads":1,"S27_RankedCupDiamondSquads":1,"S27_RankedCupBronzeSquads":1,"S27_RankedCupGoldSquads":1,"S27_RankedCupSilverSquads":1,"S27_RankedCupZBBronzeSquads":1,"S27_RankedCupZBDiamondSquads":1,"S27_RankedCupZBGoldSquads":1,"S27_RankedCupZBSilverSquads":1,"S27_RankedCupDiamondDuos":1,"S27_RankedCupZBDiamondDuos":1,"S27_RankedCupZBPlatinumDuos":1,"S27_RankedCupPlatinumDuos":1,"S27_RankedCupBronzeDuos":1,"S27_RankedCupGoldDuos":1,"S27_RankedCupZBGoldDuos":1,"S27_RankedCupSilverDuos":1,"S27_RankedCupZBBronzeDuos":1,"S27_RankedCupZBSilverDuos":1,"S27_RankedCupBronzeSolo":1,"S27_RankedCupGoldSolo":1,"S27_RankedCupPlatinumSolo":1,"S27_RankedCupZBDiamondSolo":1,"S27_RankedCupZBBronzeSolo":1,"S27_RankedCupSilverSolo":1,"S27_RankedCupZBGoldSolo":1,"S27_RankedCupDiamondSolo":1,"S27_RankedCupZBPlatinumSolo":1,"S27_OGGrefg_Duos":1,"S27_RankedCupZBSilverSolo":1,"S26_ConsoleChampionsCupZB":2,"S27_OGGrefg_Squads":1,"S26_ConsoleChampionsCup":2,"S27_OGJacob_Duos":2,"S27_OGAmar_Duos":2,"S27_OGInoxtag_Duos":1,"S26_DuosCashCup":2,"S26_MixUpMondaysBR":1,"S26_DuosZBVictoryCashCup":2,"S26_MixUpMondaysZB":1,"S26_SoloVictoryCashCup":2,"S26_PlaystationCupSeptember":1,"S26_FNCSCommunityCup":1,"S26_PlaystationCupZBSeptember":1,"S25_ConsoleChampionsCup":2,"S25_FNCS_LastChanceMajor":1,"S26_PerfEvaluation":2,"S25_FNCS_Major3_GrandFinals":1,"S25_FNCS_Major3_Week3":1,"S25_FNCS_Major3_Week2":1,"S25_FNCS_Major3_Week1":1,"S25_FNCSCommunityCup":1,"S25_GalaxyCup4Android":1,"S25_GalaxyCup4":1,"S25_JJKCup":1,"S25_ZBDuosFillQuickCup":1,"S25_DuosFillQuickCup":1,"S25_DuosCashCup":2,"S25_SoloVictoryCashCup":2,"S25_DuosZBVictoryCashCup":2,"S25_PlaystationCupJune":1,"S25_PerfEvaluation":2,"S25_PlaystationCupZBJune":1,"S24_ConsoleChampionsCupMay":2,"S24_FNCS_Major2_GrandFinals":1,"S24_SoloVictoryCup":2,"S24_TriosZBVictoryCashCup":2,"S24_FNCS_Major2_SurgeWeek":1,"S24_FNCS_Major2_Week3":1,"S24_DuosFillQuickCup":1,"S24_FNCS_Major2_Week2":1,"S24_FNCS_CommunityCup":1,"S24_FNCS_Major2_Week1":1,"S24_DuosCashCup":2,"S24_PlaystationCupMar":1,"S24_MamaBenjyFishy":2,"S23_FNCS_Major1_GrandFinals":1,"S24_ConsoleChampionsCup":2,"S24_RenegadeRunnerCupBuild":1,"S24_RenegadeRunnerCupBuildZB":1,"S24_ZBTriosFillQuickCup":1,"S23_FNCS_Major1_SurgeWeek":1,"S23_FNCS_Major1_Week2":1,"S23_PlaystationCupFeb":1,"S23_FNCS_Major1_Week3":1,"S23_CreedCup":1,"S23_FNCS_CommunityCup":1,"S23_FNCS_Major1_Week1":1,"S23_SoloCashCup":2,"S23_SuperFlakesCup":1,"S23_DivisionalCups_Challenger":1,"S23_DivisionalCups_Elite_Finals":1,"S23_ZBMQuickCup":1,"S23_ThunderCup":2,"S23_ZBMCashCup":1,"S23_DuosFillQuickCup":1,"S23_DivisionalCups_Elite":1,"S23_DivisionalCups_Contender":1,"S23_LGTriosCashCup":2,"S23_LGSoloCashCup":2,"S23_PlaystationCupJan":1,"S33_SoloCashCup":2,"S23_LGTriosQuickCup":1,"S22_LGTriosQuickTest_public":1,"S23_thekidlaroi":1,"S23_LGSoloQuickCup":1,"S33_RankedCupEliteDuos":1,"S33_RankedCupBSGDuos":1,"S33_RankedCupPDDuos":1,"S33_OGCupZB":1,"S33_PerformanceEvaluation":2,"S33_RankedCupBSSolo":1,"S33_OGCup":1,"S33_RankedCupBSGSolo":1,"S33_FNCSDivisionalCup_Division1":1,"S33_RankedCupEliteSolo":1,"S33_RankedCupPDSolo":1,"S33_FNCSDivisionalCup_Division2":1,"S33_FNCSDivisonalCup_Division3":1,"S32_SoloVictoryCashCup":2,"S32_PerformanceEvaluation":2,"S33_PlaystationCup":1,"S33_FNCS_Trial":1,"S32_SoloZBVictoryCashCup":2,"S32_RankedCupEliteDuos":1,"S32_TriosCashCup":2,"S32_RankedCupZBPlatinumDuos":1,"S32_RankedCupZBBSGDuos":1,"S32_RankedCupPDDuos":1,"S32_RankedCupBSGSolo":1,"S32_RankedCupEliteSolo":1,"S32_RankedCupBSGDuos":1,"S32_TriosCashCup_ZB":2,"S32_RankedCupZBBSGSolo":1,"S32_RankedCupZBPlatinumSolo":1,"S32_RankedCupPDSolo":1,"S32_PlatformReloadDuosCashCupMobile":1,"S32_SquadsReloadCup":1,"S32_FNCSCommunityCups":1,"S31_TriosCashCup":2,"S32_PlatformReloadDuosCashCupConsole":1,"S32_PlatformReloadDuosCashCupPC":1,"S31_RankedCupBRBSGDuos":1,"S31_SquadsReloadCup":1,"S31_RankedCupBREliteDuos":1,"S31_SymbioteCup":1,"S31_RankedCupBRPDDuos":1,"S31_RankedCupZB_BSGDuos":1,"S31_SoloVictoryCashCup":2,"S31_RankedCupZB_PlatinumDuos":1,"S31_SoloZBVictoryCashCup":2,"S31_SquadsReloadVictoryCashCup":2,"BambiRaptor":1,"S31_PerformanceEvaluationReloadTest":1,"S31_InfluencerCup":2,"S31_PlatformReloadDuosCashCupMobile":2,"S31_PlatformReloadDuosCashCupConsole":2,"S31_PlatformReloadDuosCashCupPC":2,"S31_RubiusIconCup":1,"S31_RankedCupBSGDuos":1,"S31_DuosCashCupZB":2,"S31_RankedCupPDDuos":1,"S31_DuosCashCup":2,"S31_RankedCupZBBSGDuos":1,"S31_RankedCupEliteDuos":1,"S31_RankedCupZBPlatinumDuos":1,"S31_PerformanceEvaluation":2,"S31_PlaystationSypherPKCup":1,"S31_FNCSCommunityCups_KunoRenzo":1,"S30_Reload":2,"S31_FNCSCommunityCups_Siren":1,"S31_FNCSCommunityCups_Sparkplug":1,"S30_ReloadZB":2,"S30_d4vd_Cup":1,"S30_FNCS_Major3_GrandFinals":1,"S30_FNCS_Major3_SemiFinalLowerBracket":2,"S30_FNCS_Major3_SemiFinalUpperBracket":2,"S30_SoloVictoryCashCup":2,"S30_FNCSCommunityCups":1,"S30_SoloZBVictoryCashCup":2,"S31_FNCSCommunityCups_Stashd":1,"S30_RankedCupBSGDuos":1,"S30_RankedCupEliteDuos":1,"S30_ConsoleCashCups":2,"S30_RankedCupPDDuos":1,"S30_SquadsVictoryCashCup":2,"S31_FNCSCommunityCups_Kyra":1,"S30_RankedCupZBPlatinumDuos":1,"S30_RankedCupZBBSGDuos":1,"S30_OpenTriosCupBR":1,"S30_OpenTriosCupZB":1,"S30_RankedCupBSGSolo":1,"S30_RankedCupEliteSolo":1,"S30_RankedCupPDSolo":1,"S30_RankedCupZBBSGSolo":1,"S30_OpenDuosCupZB":1,"S30_DuosCashCupZB":2,"S30_RankedCupZBPlatinumSolo":1,"S30_OpenDuosCupBR":1,"S30_DuosCashCup":2,"S30_RankedCupBSGSquads":1,"S30_RankedCupEliteSquads":1,"S30_RankedCupZBPlatinumSquads":1,"S30_NickEh":1,"S30_RankedCupZBBSGSquads":1,"S30_RankedCupPDSquads":1,"S30_PlaystationCupJune":1,"S30_FNCS_Major3_Qualifier2":2,"S30_FNCS_Major3_Qualifier1":2,"S30_MetallicaCup":1,"S30_PerformanceEvaluation":2,"S29_FNCS_Major2_GrandFinals":1,"S29_FNCS_Major2_SemiFinalLowerBracket":2,"S29_FNCS_Major2_SemiFinalUpperBracket":2,"S30_PlaystationCupZBJune":1,"S29_RankedCupBronzeSquads":1,"S29_FNCSCommunityCups":1,"S29_RankedCupDiamondSquads":1,"S29_RankedCupPlatinumSquads":1,"S29_RankedCupGoldSquads":1,"S29_RankedCupSilverSquads":1,"S29_RankedCupEliteSquads":1,"S29_RankedCupZBBronzeSquads":1,"S29_RankedCupZBEliteSquads":1,"S29_RankedCupZBDiamondSquads":1,"S29_RankedCupZBSilverSquads":1,"S29_RankedCupZBPlatinumSquads":1,"S29_RankedCupBronzeDuos":1,"S29_RankedCupZBGoldSquads":1,"S29_RankedCupGoldDuos":1,"S29_RankedCupSilverDuos":1,"S29_RankedCupDiamondDuos":1,"S29_RankedCupPlatinumDuos":1,"S29_RankedCupZBDiamondDuos":1,"S29_RankedCupZBBronzeDuos":1,"S29_RankedCupEliteDuos":1,"S29_RankedCupZBEliteDuos":1,"S29_RankedCupZBGoldDuos":1,"S29_RankedCupBronzeSolo":1,"S29_RankedCupZBPlatinumDuos":1,"S29_RankedCupZBSilverDuos":1,"S29_RankedCupDiamondSolo":1,"S29_RankedCupGoldSolo":1,"S29_RankedCupEliteSolo":1,"S29_RankedCupPlatinumSolo":1,"S29_RankedCupZBEliteSolo":1,"S29_RankedCupZBBronzeSolo":1,"S29_RankedCupSilverSolo":1,"S29_RankedCupZBDiamondSolo":1,"S29_RankedCupZBGoldSolo":1,"S29_RankedCupZBPlatinumSolo":1,"S29_RankedCupZBSilverSolo":1,"S29_FNCS_Major2_Qualifier2":2,"S29_ConsoleCashCupsZB":2,"S29_ConsoleCashCups":2,"S29_FNCS_Major2_Qualifier1":2,"S29_MixUpMondaysZB":1,"S29_PerformanceEvaluation":2,"S29_MixUpMondaysBR":1,"S29_DuosZBVictoryCashCup":2,"S29_SoloVictoryCashCup":2,"S29_DuosCashCup":2,"S29_PlaystationCupMarch":1,"S28_FNCS_Major1_GrandFinals":1,"S29_PlaystationCupZBMarch":1,"S28_FNCS_Major1_SemiFinalUpperBracket":2,"S28_FNCS_Major1_SemiFinalLowerBracket":2,"S28_RankedCupBronzeSquads":1,"S28_FNCS_Major1_Qualifier2":2,"S28_FNCSCommunityCups":1,"S28_RankedCupGoldSquads":1,"S28_RankedCupPlatinumSquads":1,"S28_RankedCupDiamondSquads":1,"S28_RankedCupSilverSquads":1,"S28_RankedCupZBBronzeSquads":1,"S28_RankedCupZBDiamondSquads":1,"S28_RankedCupZBGoldSquads":1,"S28_RankedCupBronzeDuos":1,"S29_RiseofMidasCup":1,"S28_RankedCupZBSilverSquads":1,"S28_RankedCupZBPlatinumSquads":1,"S28_RankedCupGoldDuos":1,"S28_RankedCupSilverDuos":1,"S28_RankedCupPlatinumDuos":1,"S28_RankedCupZBPlatinumDuos":1,"S28_RankedCupZBBronzeDuos":1,"S28_RankedCupZBDiamondDuos":1,"S28_RankedCupZBGoldDuos":1,"S28_RankedCupDiamondDuos":1,"S28_RankedCupBronzeSolo":1,"S28_RankedCupZBSilverDuos":1,"S28_RankedCupSilverSolo":1,"S28_RankedCupGoldSolo":1,"S28_RankedCupZBBronzeSolo":1,"S28_RankedCupPlatinumSolo":1,"S28_RankedCupZBDiamondSolo":1,"S28_RankedCupDiamondSolo":1,"S28_RankedCupZBGoldSolo":1,"S28_RankedCupZBPlatinumSolo":1,"S39_PerformanceEvaluation":2,"S39_ReloadCashVictoryCup_Dec":2,"S28_RankedCupZBSilverSolo":1,"S28_FNCS_Major1_Qualifier1":2,"S39_NvidiaCup":1,"S38_PlayStationCupReload":2,"S38_SoloSeriesCup":1,"S38_SquadsVictoryCup":2,"S39_1MillionUnrealCup":1,"S39_SoloSeriesCup":1,"S38_RankedCupDuosZB":1,"S38_RankedCupDuosBR":1,"S38_OGCup_BR":1,"S38_OGCup":1,"S38_OGCup_ZB":1,"S38_DuosVictoryCup":2,"S39_BleachCup":1,"S38_BlitzMobileCup":2,"S38_ReloadQuickCup_Group3":2,"S38_ReloadQuickCup":2,"S38_RankedCupSolo":1,"S38_ReloadQuickCup_Group2":2,"S38_StrangerThingsMobileCup":1,"S38_PerformanceEvaluation":2,"S38_TouchOnlyMobileCup":2,"S38_RankedCupReloadDuos":1,"S37_DuosDivisionalCup_Division1":1,"S37_HauntedCupWednesday":1,"S37_EarlyAccessCup":2,"S37_HauntedCupJason":1,"S38_StrangerThingsCup":1,"S37_DuosDivisionalCup_Division2":1,"S37_DuosDivisionalCup_Division3":1,"S37_DuosDivisionalCup_Division4":1,"S37_ReloadQuickCup":2,"S37_SoloSeriesCup":1,"S37_ReloadQuickCup_Group2":2,"S37_DuosDivisionalCup_Division5":1,"S37_ReloadQuickCup_Group3":2,"S37_PerformanceEvaluationDuos":2,"S39_RankedCupReloadDuosDec":1,"S37_FrenchWeekly":1,"S37_DuosDivisionalCupTrial":1,"Dinosauron_Official":1,"S37_PlayStationCup":1,"S37_KaiCenatIconCup":1,"S37_MrSavageIconCup":1,"S37_OGCups_BR":1,"S37_BlitzMobileCupWeekly":1,"S37_ConsoleDuosCashCups":2,"S37_RankedCupReloadDuos":1,"S37_OGCups_ZB":1,"S37_PerformanceEvaluation":2,"S37_RankedCupDuos":1,"S37_FNCSDivisionalCup_Division1":1,"S37_SurfWitchBlitzMobileCup":1,"S37_RankedCupSolo":1,"S37_AxeOfChampsBlitzMobileCup":1,"S37_EliteZadieCup_Group3":2,"S37_EliteZadieCup_Group2":2,"S37_EliteZadieCup":2,"S37_BlitzCupOneSwing":1,"S37_BladeOfChampsCupGroup3":2,"S37_FNCSDivisionalCup_Division3":1,"S37_FNCSDivisionalCup_Division2":1,"S37_BladeOfChampsCupGroup2":2,"S37_AxeOfChampionsCup":1,"S37_SurfWitchCup":1,"S37_FNCSCommunityCups_Clix":1,"S37_BladeOfChampsCup":2,"S37_BlitzCups":1,"S37_BlitzMobileCup":1,"S37_BlitzCupsAllPlatforms":1,"S37_AceWildCardCup_Group3":2,"S37_FNCSCommunityCups_Bugha":1,"S37_ChampionCrystalCup":1,"S37_FNCSCommunityCups_Loserfruit":1,"S37_AceWildCardCup":2,"S37_FNCSCommunityCups_Lachlan":1,"S37_AceWildCardCup_Group2":2,"S36_FNCSMajor3_Final":1,"S36_FNCSMajor3_LastChanceQualifier":1,"S36_RangerCup_Pink":1,"S36_SquidGroundVictoryDuosCup":2,"S36_FNCSMajor3_GroupStage":1,"S37_ChampionPJCup":1,"S36_RangerCup_Red":1,"S36_PlayStationCup":1,"S36_FNCSMajor3_PlayInStage":1,"S36_OGCups_ZB":1,"S36_OGCups_BR":1,"S36_VictoryDuosCup":2,"S36_FantasticFourCups":1,"S36_FNCSCommunityCup":1,"S36_PerformanceEvaluation":2,"S36_RankedCupReloadDuos":1,"S36_RankedCupTrios":1,"S36_FNCSDivisionalCup_Division1":1,"S36_RankedCupSolo":1,"S36_FNCSDivisionalCup_Division3":1,"S36_FNCSDivisionalCup_Division2":1,"S35_VictoryDuosCup":2,"S35_OGCupZB":1,"S36_SquidGroundsCups":1,"S35_OGCup":1,"S35_RankedCupBSGDuos":1,"S35_PerformanceEvaluation":2,"S35_RankedCupPDDuos":1,"S35_RankedCupEliteDuos":1,"S35_RankedCupBSGSolo":1,"S35_FNSCShowdown":2,"S35_RankedCupEliteSolo":1,"S35_ReloadRankedCup_PD_Duos":1,"S35_ReloadRankedCup_BSG_Duos":1,"S35_RankedCupPDSolo":1,"S35_RankedCupBSGTrios":1,"S35_RankedCupPDTrios":1,"Acrocanthosaurus_Official":1,"S35_ReloadRankedCup_Elite_Duos":1,"S35_RankedCupEliteTrios":1,"S34_PerformanceEvaluationReloadAll":2,"S34_PlaystationCup":1,"S34_FNCSMajor2_Final":1,"S35_FNCSCommunityCups_Lachlan":1,"S35_FNCSCommunityCups_Loserfruit":1,"S35_FNCSCommunityCups_Clix":1,"S34_FNCSMajor2_LastChanceQualifier":1,"S34_FNCSMajor2_GroupStage":1,"S35_FNCSCommunityCups_Bugha":1,"S34_EliteZadieCup":1,"S34_FNCSMajor2_PlayInStage":1,"S34_ThunderboltsCup":1,"S34_SoloCashCup":2,"S34_RankedCupBSGDuos":1,"S34_RankedCupEliteDuos":1,"S34_FNCSCommunityCups":1,"S34_RankedCupBSGSolo":1,"S34_RankedCupPDDuos":1,"S34_FNCSDivisionalCup_Division1":2,"S34_RankedCupPDSolo":1,"S34_RankedCupEliteSolo":1,"S34_FNCSDivisionalCup_Division3":2,"S34_PerformanceEvaluationReload":2,"S34_FNCSDivisionalCup_Division2":2,"S34_PerformanceEvaluation":2,"S34_OGCupZB":1,"S33_FNCSMajor1_Final":1,"S33_FNCSMajor1_LastChanceQualifier":1,"S34_ClixIconCup":1,"S34_OGCup":1,"S34_ShoheiOhtaniCup":1,"S33_FNCSMajor1_GroupStage":1,"S42_ReloadReloadSoloVictoryCup":2,"S42_FNCSSolo_HeatsStage":1,"S42_FNCSSoloFastTracks":1,"S33_FNCSMajor1_PlayInStage":1,"S42_FNCSSolo_LastChanceQualifier":1,"S42_FNCSSoloQualifiers":2,"S42_PSNickEh30_ZB":1,"S33_OGCommunityCupZB":1,"S42_PSNickEh30":1,"S33_FNCSCommunityCups":1,"MannekenPis_Official":1,"S42_FNCSSolo_Final":1,"S34_LanternFestCup":1,"S42_MadisonBeerIconCup":1,"S42_MobileVictoryCup_ReloadminiV":2,"S33_OGCommunityCup":1,"S42_Persona5Cup_ZB":1,"S42_Persona5Cup":1,"S42_Persona5Cup_Mobile":1,"S42_SoloVictoryCup":2,"S42_MadisonBeerIconCup_ZB":1,"S42_ArenaPerfEval":1,"S42_MadisonBeerIconCup_Mobile":1,"S42_ChampionFocusFNCSCup_ZB":1,"S42_ChampionFocusFNCSCup":1,"S42_ChampionFocusFNCSMobileCup":1,"S42_CyperpranksCup":1,"S42_CyperpranksCup_ZB":1,"S42_CyperpranksCup_Mobile":1,"S42_KingdomHeartsCup":1,"S42_KingdomHeartsCup_ZB":1,"S42_KingdomHeartsCup_Mobile":1,"S39_RankedCupSoloDec":1,"S42_IronmouseIconCup":1,"S42_MobileSeriesCupSemiFinal":1,"S42_IronmouseIconCup_ZB":1,"S42_WeezyIconCup":1,"S42_MobileSeriesGroup2":1,"S42_WeezyIconCup_ZB":1,"S42_MobileSeriesGroup1":1,"S42_MegaManCup":1,"S42_RankedCupSoloReload":1,"S42_PerformanceEvaluation":2,"S42_RankedCupSoloReload_ZB":1,"S42_MegaManCup_Mobile":1,"S42_MegaManCup_ZB":1,"S42_TheHectorino_Mobile":1,"S42_ConsoleVCC_SolosZB":2,"S42_MobileSeriesLCQ":2,"S42_RankedCupDuos":1,"S42_ReloadCashCup_DuosZB":2,"S42_RankedCupSolo":1,"S42_RankedCupReloadDuos":1,"S42_RankedCupSolo_ZB":1,"S42_FNCSDivisionalCup_Division1":1,"S42_ArenaTestCup":1,"S42_FNCSDivisionalCup_Division5":1,"S42_FNCSDivisionalCup_Division3":1,"S42_FNCSDivisionalCup_Division2":1,"S42_FNCSDivisionalCup_Division4":1,"S42_ReloadDuosVictoryCup":2,"S42_CrashBandicootCup":1,"S42_CrashBandicootMobileCup":1,"S42_CrashBandicootCup_ZB":1,"S42_ShadowCup":1,"S42_ShadowCup_ZB":1,"S42_ShadowCup_Mobile":1,"S41_ReloadReloadSoloVictoryCup":2,"S41_FNCSLastChanceMajor":2,"S41_MobileVictoryCup_RES":2,"S41_MobileVictoryCup_ZB":2,"S41_DiamondTestCup":1,"S41_DiamondReloadTestCup":1,"S41_FNCSMajor2_Final":1,"S41_PSTypicalGamer_ZB":1,"S41_CashCup_DuosZB":2,"S41_FNCSMajor2_HeatsStage":1,"S41_FNCSMajor2_LastChanceQualifier":1,"S41_FNCSCommunityCup_Mobile":1,"S41_FNCSCommunityCup_ZB":1,"S41_FNCSCommunityCup":1,"S41_PSTypicalGamer":1,"S41_MobileVictoryCup_ZBReload":2,"S41_DavidBeckham_ZB":1,"S41_FNCSMajor2_PlayInStage":1,"S41_DavidBeckham":1,"S41_TheOdysseyCup":1,"S41_TheOdysseyCup_ZB":1,"S41_TheOdysseyCup_Mobile":1,"S41_ConsoleCC_DuosZB":2,"S41_MobileSeriesCupQual":1,"S41_ConsoleVCC_SolosZB":2,"S41_RankedCupDuos":1,"S41_MobileSeriesHeat4":1,"S41_MobileSeriesHeat3":1,"S41_MobileSeriesHeat2":1,"S41_MobileSeriesHeat1":1,"S41_PerformanceEvaluation":2,"S41_SoloVictoryCup":2,"S41_MobileSeriesOpen":2,"S41_PerformanceEvaluationReload":2,"S41_FNCSDivisionalCup_Division5":1,"S41_FNCSDivisionalCup_Division4":1,"S41_FNCSDivisionalCup_Division3":1,"S41_FNCSDivisionalCup_Division1":1,"S41_FNCSDivisionalCup_Division2":1,"S41_MobileTestCup":2,"S41_ReloadEliteSeries4Final":1,"S41_MobileVictoryCup_BR":2,"S41_ReloadEliteSeries4Heat4":1,"S41_ReloadEliteSeries4Heat3":1,"S41_MongraalIconCup":1,"S42_RankedCupDuos_ZB":1,"S42_RankedCupReloadDuos_ZB":1,"S41_ReloadEliteSeries4Heat2":1,"S41_ReloadEliteSeries4Heat1":1,"S41_SupergirlCup":1,"S41_SupergirlCup_ZB":1,"S41_SupergirlMobileCup":1,"S41_ReloadEliteSeries4PlayIn":1,"S41_MobileVictoryCup_ReloadminiV":2,"S41_ReloadEliteSeries4Opens":1,"S41_ViniJr":1,"S41_ViniJr_ZB":1,"S41_PSCupDaysOfPlay":1,"S41_ViniJr_Mobile":1,"Bratwurst_Official":1,"S41_PSCupDaysOfPlay_ZB":1,"S40_DuosReloadVictoryCup":2,"S40_TypicalGamerCup":1,"S40_MandalorianCup":1,"S40_MandalorianCup_ZB":1,"S40_ReloadEliteSeries3Final":1,"S40_MandalorianMobileCup":1,"S40_CashCup_TriosZB":2,"S40_ReloadEliteSeries3Heat4":1,"S40_ReloadEliteSeries3Heat3":1,"S40_MobileSeriesMay":2,"S40_ReloadEliteSeries3Heat2":1,"S40_ReloadEliteSeries3PlayIn":1,"S40_ReloadEliteSeries3Heat1":1,"S40_BakMobileCup":1,"S40_ReloadEliteSeries3Opens":1,"S40_TheDonatoMobileCup":1,"S40_PlayStationCupClixZB":1,"S40_RankedCupDuos":1,"S40_MobileSeriesCupQual":1,"S40_PlayStationCupClix":1,"S40_MobileSeriesApr":2,"S40_PerformanceEvaluationReload":2,"S40_FNCSMajor1_SecondChance":1,"S40_FNCSMajor1_Final":1,"S41_RankedCupSoloReload":1,"S40_ConsoleCC_TriosZB":2,"S40_FNCSMajor1_LastChanceQualifier":1,"S40_EliteStrongholdTestCups":1,"S40_FNCSMajor1_HeatsStage":1,"S40_EliteStrongholdEA":1,"S40_TripleThreatCup":1,"S40_TripleThreatMobileCup":1,"S40_ChampionKorFNCSCup":1,"S40_ChampionKorFNCSCupMobile":1,"S40_ShowdownSeries_EmperorZurgCup":1,"S40_ShowdownSeries_BuzzLightyearCup":1,"S40_SpidergamerCupMobile":1,"S40_FNCSMajor1_PlayInStage":1,"S40_ShowdownSeries_BuffPerryCup":1,"S40_ShowdownSeries_DrDoofenshmirtzCup":1,"S40_PerformanceEvaluation":2,"S40_FNCSDivisionalCup_Division1":1,"S40_FNCSDivisionalCup_Division5":1,"S40_FNCSDivisionalCup_Division4":1,"S40_FNCSDivisionalCup_Division3":1,"S40_FNCSDivisionalCup_Division2":1,"S40_RankedCupDuosZB":1,"S40_ConsoleVCC_SolosZB":2,"S41_RankedCupReloadDuos":1,"S40_RankedCupReloadDuos":1,"S41_RankedCupDuosZB":1,"S40_SoloVictoryCup":2,"S40_MobileSeriesMar":1,"S40_PlayStationCupMrSavage_Final":1,"S40_ShowdownSeries_DaffyCup":1,"S40_PlayStationCupMrSavageZB":1,"S40_PlayStationCupMrSavage_Qualifier":1,"S40_ShowdownSeries_LolaBunnyCup":1,"S40_DuckythegamerCupMobile":1,"S41_RankedCupSolo":1,"S39_SoloVictoryCup":2,"S40_ShowdownSeries_JonSnow":1,"S40_ShowdownSeries_NightKing":1,"S39_MobileSeriesCupMarQual":1,"S39_LanternFestCupMobile":1,"S39_FNCSDivisionalCup_Division1":1,"S39_ReloadEliteSeries2Final":1,"S39_LanternFestCup":1,"S39_FNCSDivisionalCup_Division5":1,"S39_FNCSDivisionalCup_Division4":1,"S39_PickleRickCup":1,"S39_FNCSDivisionalCup_Division3":1,"S39_ReloadEliteSeries2Heat4":1,"S39_FNCSDivisionalCup_Division2":1,"S39_MobileSeriesMar":2,"S39_ReloadEliteSeries2Heat1":1,"S39_MobileTestCup":2,"S39_ReloadEliteSeries2Heat2":1,"S39_ReloadEliteSeries2Heat3":1,"S39_MobileSeriesCupFebQual":1,"S39_ReloadEliteSeries1Final":1,"S39_ReloadEliteSeries2PlayIn":2,"S39_ReloadEliteSeries1Heat4":1,"S39_SoloLevelingMobileCup":1,"S39_ReloadEliteSeries2Opens":1,"S39_ReloadEliteSeries1Heat2":1,"S39_ReloadEliteSeries1Heat3":1,"S39_ReloadEliteSeries1Heat1":1,"S39_RankedCupSoloJan":1,"S39_KPDHCup":1,"S39_PlayStationCupZB":1,"S39_MobileSeriesFeb":2,"S39_SoloLevelingCup":1,"S39_DuosConsoleVictoryCupZB_Jan":2,"S39_PlayStationCup":1,"S39_ReloadEliteSeries1PlayIn":2,"S39_SoloSeriesCupFinal":1,"S39_FNCSDivisionalCupTrial":1,"S39_MobileSeriesCupJanQual":1,"S39_ReloadCashVictoryCup_Jan":2,"S39_DuosVictoryCup":2,"S39_SoloSeriesCupHeats":2,"S39_ReloadEliteSeries1Opens":1,"S39_MobileSeriesJan":2,"S39_KizunaAICupMobile":1,"S39_ReloadEliteSeries1OpenTEST":1,"S39_KizunaAICup":1,"S40_RankedCupSolo":1,"S39_RankedCupDuosBR":1,"S39_RankedCupReloadDuosJan":1,"S39_RankedCupDuosZBJan":1};
/* CUP ROUNDS end */
/* Раундов у капа за вечер — по окнам Epic (его вопрос 28.09: «два ли раунда в соло кэшкапах
   2020… и в дейли капах вроде не два было»). Замер: Solo Cash Cup 2019–20, Daily Duos/Trios,
   капы 2021 — одно окно в день; Victory Cup 2023+ и Cash Cup V2 (весна 2020) — Round 1 и 2.
   null — события нет в выгрузке (ЛАН, Кубок наций…), вечер идёт как шёл. */
function ccCupRounds(ev){
  if(!ev || typeof CC_CUP_ROUNDS==='undefined') return null;
  const id=String(ev.id||'');
  if(!id) return null;
  let r=null;
  Object.keys(CC_CUP_ROUNDS).forEach(k=>{ if(k===id || k.indexOf(id+'_')===0) r=Math.max(r||0, CC_CUP_ROUNDS[k]); });
  return r;
}
/* CUP SCORING begin — tools/build-cup-scoring.js */
const CC_SCORE_R=[[[[1,1],[2,1],[3,1],[4,1],[5,1],[6,1],[7,1],[8,1],[9,1],[10,1]],1],[[],[]],[[[1,9],[2,4],[3,4],[4,4],[5,4],[6,2],[7,2],[8,2],[9,2],[10,2],[11,2],[12,2],[13,2],[14,2],[15,2],[16,2],[17,2],[18,2],[19,2],[20,2],[21,2],[22,2],[23,2],[24,2],[25,2]],4],[[[1,16],[2,6],[3,6],[4,6],[5,6],[6,3],[7,3],[8,3],[9,3],[10,3],[11,3],[12,3],[13,3],[14,3],[15,3],[16,3],[17,3],[18,3],[19,3],[20,3],[21,3],[22,3],[23,3],[24,3],[25,3]],6],[[[1,3],[5,2],[15,2],[25,3]],1],[[[1,944],[2,4],[3,4],[4,4],[5,4],[6,2],[7,2],[8,2],[9,2],[10,2],[11,2],[12,2],[13,2],[14,2],[15,2],[16,2],[17,2],[18,2],[19,2],[20,2],[21,2],[22,2],[23,2],[24,2],[25,2]],4],[[[1,3],[2,3],[4,3],[8,3]],1],[[[1,3],[2,3],[4,3],[8,3],[12,3]],1],[[[1,11],[2,6],[3,4],[4,4],[5,4],[6,3],[7,3],[8,3],[9,3],[10,3],[11,3],[12,3],[13,3],[14,3],[15,3],[16,3],[17,3]],4],[[[1,3],[3,2],[7,2],[12,3]],1],[[[1,3],[5,2],[10,2],[15,3]],1],[[[0,20],[1,15],[3,10],[7,10]],0],[[[1,3],[2,3],[4,3],[6,3],[12,3]],1],[[[1,10],[2,4],[3,2],[4,1],[5,1],[6,1],[7,1],[8,1],[9,1],[10,1],[11,1],[12,1],[13,1],[14,1],[15,1],[16,1],[17,1],[18,1],[19,1],[20,1],[21,1],[22,1],[23,1],[24,1],[25,1],[26,1],[27,1],[28,1],[29,1],[30,1],[31,1],[32,1],[33,1],[34,1],[35,1],[36,1],[37,1],[38,1],[39,1],[40,1],[41,1],[42,1],[43,1],[44,1],[45,1],[46,1],[47,1],[48,1],[49,1],[50,1]],5],[[[1,3],[2,3],[4,3],[6,3],[8,3]],1],[[[1,15]],1],[[[1,2],[3,2],[6,2],[10,2],[15,2],[21,2],[28,1]],1],[[[1,7],[2,4],[3,2],[4,1],[5,1],[6,1],[7,1],[8,1],[9,1],[10,1],[11,1],[12,1],[13,1],[14,1],[15,1],[16,1],[17,1],[18,1],[19,1],[20,1],[21,1],[22,1],[23,1],[24,1],[25,1],[26,1],[27,1],[28,1],[29,1],[30,1],[31,1],[32,1],[33,1],[34,1],[35,1],[36,1],[37,1],[38,1],[39,1],[40,1],[41,1],[42,1],[43,1],[44,1],[45,1],[46,1],[47,1],[48,1],[49,1],[50,1]],2],[[[1,7],[2,4],[3,2],[4,1],[5,1],[6,1],[7,1],[8,1],[9,1],[10,1],[11,1],[12,1],[13,1],[14,1],[15,1],[16,1],[17,1],[18,1],[19,1],[20,1],[21,1],[22,1],[23,1],[24,1],[25,1],[26,1],[27,1],[28,1],[29,1],[30,1],[31,1],[32,1],[33,1],[34,1],[35,1],[36,1],[37,1],[38,1],[39,1],[40,1],[41,1],[42,1],[43,1],[44,1],[45,1],[46,1],[47,1],[48,1],[49,1],[50,1]],4],[[[1,7],[2,4],[3,3],[4,2],[5,3],[6,2],[7,2],[8,2],[9,2],[10,4],[15,3],[20,3],[30,2],[40,2]],4],[[[1,7],[2,4],[3,3],[4,2],[5,3],[6,2],[7,2],[8,2],[9,2],[10,4],[15,3],[20,3],[30,2],[40,2]],2],[[[1,7],[2,4],[3,3],[4,1],[5,2],[6,1],[7,1],[8,1],[9,1],[10,3],[15,2],[20,2],[30,2],[40,1],[50,1],[75,1]],4],[[[1,7],[3,4],[6,2],[10,1],[15,1],[21,1],[28,1]],1],[[[1,7],[2,4],[3,3],[4,2],[5,1],[6,1],[7,1],[8,1],[9,1],[10,3],[15,2],[20,2],[30,2],[40,1],[50,1],[75,1]],4],[[[1,14],[2,8],[3,6],[4,3],[5,3],[6,3],[7,3],[8,3],[9,3],[10,3],[11,3],[12,3],[13,3],[14,3],[15,3],[16,3],[17,3]],3],[[[1,14],[2,8],[3,6],[4,3],[5,3],[6,3],[7,3],[8,3],[9,3],[10,3],[11,3],[12,3],[13,3],[14,3],[15,3],[16,3],[17,3]],4],[[[1,6],[2,3],[3,2],[4,2],[5,2],[6,1],[7,1],[8,1],[9,1],[10,1],[11,1],[12,1],[13,1],[14,1],[15,1],[16,1],[17,1],[18,1],[19,1],[20,1],[21,1],[22,1],[23,1],[24,1],[25,1]],1],[[[1,6],[2,3],[3,2],[4,2],[5,2],[6,1],[7,1],[8,1],[9,1],[10,1],[11,1],[12,1],[13,1],[14,1],[15,1],[16,1],[17,1],[18,1],[19,1],[20,1],[21,1],[22,1],[23,1],[24,1],[25,1]],3],[[[1,20]],0],[[[1,8],[2,5],[3,4],[4,3],[5,2],[6,2],[7,2],[8,2],[9,2],[10,2],[11,1],[12,1],[13,1],[14,1],[15,1],[16,1],[17,1],[18,1],[19,1],[20,1],[21,1],[22,1],[23,1],[24,1],[25,1],[26,1],[27,1],[28,1],[29,1],[30,1],[31,1],[32,1],[33,1],[34,1],[35,1],[36,1],[37,1],[38,1],[39,1],[40,1]],2],[[[1,8],[2,5],[3,4],[4,3],[5,2],[6,2],[7,2],[8,2],[9,2],[10,2],[11,1],[12,1],[13,1],[14,1],[15,1],[16,1],[17,1],[18,1],[19,1],[20,1],[21,1],[22,1],[23,1],[24,1],[25,1],[26,1],[27,1],[28,1],[29,1],[30,1],[31,1],[32,1],[33,1],[34,1],[35,1],[36,1],[37,1],[38,1],[39,1],[40,1],[41,1],[42,1],[43,1],[44,1],[45,1],[46,1],[47,1],[48,1],[49,1],[50,1]],3],[[[1,3],[2,2],[3,1],[4,1],[5,1],[6,1],[8,1],[10,1],[13,1],[17,1],[25,1]],1],[[[1,3],[2,1],[3,1],[5,1],[10,1],[15,1],[20,1],[25,1],[30,1],[40,1],[50,1],[75,1]],1],[[[1,6],[2,3],[3,3],[4,3],[5,3],[6,3],[9,3],[12,2],[15,2],[18,2],[21,2],[24,1],[27,1],[30,1]],1],[[[1,14],[2,8],[3,6],[4,3],[5,3],[6,3],[7,3],[8,3],[9,3],[10,3],[11,3],[12,3],[13,3],[14,3],[15,3],[16,3],[17,3]],5],[[[1,7],[2,4],[3,2],[4,1],[5,1],[6,1],[7,1],[8,1],[9,1],[10,1],[11,1],[12,1],[13,1],[14,1],[15,1],[16,1],[17,1],[18,1],[19,1],[20,1],[21,1],[22,1],[23,1],[24,1],[25,1],[26,1],[27,1],[28,1],[29,1],[30,1],[31,1],[32,1],[33,1],[34,1],[35,1],[36,1],[37,1],[38,1],[39,1],[40,1],[41,1],[42,1],[43,1],[44,1],[45,1],[46,1],[47,1],[48,1],[49,1],[50,1]],5],[[[0,20]],0],[[[1,10]],1],[[[1,3],[10,3],[20,3],[30,3],[40,3],[50,3],[60,3],[70,3],[80,3],[90,3]],2],[[[1,6],[2,3],[3,2],[4,2],[5,2],[6,1],[7,1],[8,1],[9,1],[10,1],[11,1],[12,1],[13,1],[14,1],[15,1],[16,1],[17,1],[18,1],[19,1],[20,1],[21,1],[22,1],[23,1],[24,1],[25,1],[26,1],[27,1],[28,1],[29,1],[30,1],[31,1],[32,1],[33,1],[34,1],[35,1],[36,1],[37,1],[38,1],[39,1],[40,1],[41,1],[42,1],[43,1],[44,1],[45,1],[46,1],[47,1],[48,1],[49,1],[50,1]],3],[[[1,6],[2,3],[3,2],[4,2],[5,2],[6,1],[7,1],[8,1],[9,1],[10,1],[11,1],[12,1],[13,1],[14,1],[15,1],[16,1],[17,1],[18,1],[19,1],[20,1],[21,1],[22,1],[23,1],[24,1],[25,1],[26,1],[27,1],[28,1],[29,1],[30,1],[31,1],[32,1],[33,1],[34,1],[35,1],[36,1],[37,1],[38,1],[39,1],[40,1],[41,1],[42,1],[43,1],[44,1],[45,1],[46,1],[47,1],[48,1],[49,1],[50,1]],4],[[[1,6],[2,3],[3,2],[4,2],[5,2],[6,1],[7,1],[8,1],[9,1],[10,1],[11,1],[12,1],[13,1],[14,1],[15,1],[16,1],[17,1],[18,1],[19,1],[20,1]],2],[[[1,6],[2,2],[3,2],[4,2],[5,2],[6,2],[7,2],[8,2],[11,2],[14,2],[17,2],[20,2]],1],[[[1,15],[2,5],[4,2],[8,2],[16,1]],0],[[[1,6],[2,3],[3,3],[4,3],[5,3],[6,2],[7,2],[8,2],[9,2],[10,2],[11,2],[12,2],[13,2],[14,2],[15,2],[16,2],[17,2],[18,2],[19,2],[20,2],[21,2],[22,1],[23,1],[24,1],[25,2]],5],[[[1,5],[2,4],[3,2],[4,1],[5,1],[6,1],[7,1],[8,1],[9,1],[10,1],[11,1],[12,1],[13,1],[14,1],[15,1],[16,1],[17,1]],1],[[[1,100]],0],[[[1,6],[2,3],[3,3],[4,3],[5,3],[8,3],[11,3],[14,2],[17,2],[20,2],[23,2],[26,1],[29,1],[30,1]],1],[[[1,6],[2,3],[3,3],[4,3],[5,3],[6,2],[7,2],[8,2],[9,2],[10,2],[11,2],[12,2],[13,2],[14,2],[15,2],[16,2],[17,2],[18,2],[19,2],[20,2],[21,2],[22,1],[23,1],[24,1],[25,1],[45,1]],5],[[[1,1],[3,1],[5,1],[7,1],[9,1],[12,1],[15,1],[25,1],[35,1],[50,1]],1],[[[1,5],[2,2],[3,3],[5,2],[10,1],[15,1],[20,1],[25,1],[30,1],[40,1],[50,1],[75,1]],1],[[[1,3],[5,2],[15,2],[25,2],[100,1]],1],[[[1,5],[2,2],[3,2],[4,2],[5,2],[6,1],[7,1],[8,1],[9,1],[10,1],[11,1],[12,1],[13,1],[14,1],[15,1],[16,1],[17,1]],1],[[[1,6],[2,4],[3,2],[4,1],[5,1],[6,1],[7,1],[8,1],[9,1],[10,1],[11,1],[12,1],[13,1],[14,1],[15,1],[16,1],[17,1],[18,1],[19,1],[20,1],[21,1],[22,1],[23,1],[24,1],[29,3],[34,3],[39,1],[44,1],[50,1]],1],[[[1,5],[2,5],[3,6],[4,1],[5,1],[6,1],[7,1],[8,1],[9,1],[10,1],[11,1],[12,1],[13,1],[14,1],[15,1],[16,1],[17,1]],2],[[[1,10]],0],[[[1,4],[2,3],[3,2],[4,1],[5,1],[10,2],[15,2],[20,2],[25,1],[35,1]],1],[[[1,5],[2,5],[3,5],[4,5],[5,5],[10,3],[20,2]],2],[[[1,6],[2,3],[3,2],[4,2],[5,2],[6,1],[7,1],[8,1],[9,1],[10,1],[11,1],[12,1],[13,1],[14,1],[15,1],[16,1],[17,1],[18,1],[19,1],[20,1],[21,1],[22,1],[23,1],[24,1],[25,1],[26,1],[27,1],[28,1],[29,1],[30,1],[31,1],[32,1],[33,1],[34,1],[35,1],[36,1],[37,1],[38,1],[39,1],[40,1],[41,1],[42,1],[43,1],[44,1],[45,1],[46,1],[47,1],[48,1],[49,1],[50,1]],1],[[[1,6],[2,3],[3,2],[4,2],[5,2],[6,1],[7,1],[8,1],[9,1],[10,1],[11,1],[12,1],[13,1],[14,1],[15,1],[16,1],[17,1],[18,1],[19,1],[20,1]],1],[[[1,6],[2,3],[3,2],[4,2],[5,2],[6,1],[7,1],[8,1],[9,1],[10,1],[11,1],[12,1],[13,1],[14,1],[15,1],[16,1],[17,1],[18,1],[19,1],[20,1],[21,1],[22,1],[23,1],[24,1],[25,1]],2],[[[1,4],[2,3],[3,3],[4,1],[5,1],[10,1],[15,1],[20,1],[25,1],[30,1],[40,1],[50,1],[75,1]],1],[[[1,3],[5,2],[15,2],[25,2],[50,1]],1],[[[1,5],[2,2],[3,3],[5,2],[10,1],[20,1],[25,1],[30,1],[40,1],[50,1],[75,1]],1],[[[1,6],[3,3],[6,2],[10,2],[20,2],[33,1]],1],[[[1,6],[2,3],[3,3],[4,3],[5,3],[6,2],[7,2],[8,2],[9,2],[10,2],[11,2],[12,2],[13,2],[14,2],[15,2],[16,2],[17,2],[18,2],[19,2],[20,2],[21,2],[22,2],[23,3]],6],[[[1,5],[2,3],[3,2],[4,1],[5,2],[6,1],[7,1],[8,1],[9,1],[10,2],[15,2],[20,2],[25,2],[30,1],[35,1],[40,1],[50,1],[75,1]],1],[[[1,4],[2,2],[3,2],[4,1],[5,1],[6,1],[7,1],[8,1],[9,1],[10,2],[11,1],[12,1],[13,1],[14,1],[15,1],[16,1],[17,3],[24,5]],2],[[[1,6],[2,3],[3,3],[4,3],[5,3],[6,2],[7,2],[8,2],[9,2],[10,2],[11,2],[12,2],[13,2],[14,2],[15,2],[16,2],[17,2],[18,2],[19,2],[20,2],[21,2],[22,1],[23,1],[24,1],[25,2]],4],[[[1,6],[2,3],[3,3],[4,3],[5,3],[6,2],[7,2],[8,2],[9,2],[10,2],[11,2],[12,2],[13,2],[14,2],[15,2],[16,2],[17,2],[18,2],[19,2],[20,2],[21,2],[22,1],[23,1],[24,1],[25,2]],6],[[[1,14],[2,8],[3,6],[4,3],[5,3],[6,3],[7,3],[8,3],[9,3],[10,3],[11,3],[12,3],[13,3],[14,3],[15,3],[16,3],[17,3]],0],[[[1,6],[2,4],[3,2],[4,1],[5,1],[6,1],[7,1],[8,1],[9,1],[10,1],[11,1],[12,1],[13,1],[14,1],[15,1],[16,1],[17,1],[18,1],[19,1],[20,1],[21,1],[22,1],[23,1],[24,1],[29,1],[34,1],[39,1],[44,1],[50,1]],1],[[[1,7],[2,4],[3,2],[4,1],[5,1],[6,1],[7,1],[8,1],[9,1],[10,1],[11,1],[12,1],[13,1],[14,1],[15,1],[16,1],[17,1],[18,1],[19,1],[20,1],[21,1],[22,1],[23,1],[24,1],[25,1],[26,1],[27,1],[28,1],[29,1],[30,1],[31,1],[32,1],[33,1],[34,1],[35,1],[36,1],[37,1],[38,1],[39,1],[40,1],[41,1],[42,1],[43,1],[44,1],[45,1],[46,1],[47,1],[48,1],[49,1],[50,1]],3],[[[1,6],[2,3],[3,3],[4,3],[5,3],[6,2],[7,2],[8,2],[9,2],[10,2],[11,2],[12,2],[13,2],[14,2],[15,2],[16,2],[17,2],[18,2],[19,2],[20,2],[21,2],[22,1],[23,1],[24,1],[25,2]],3],[[[1,5],[2,3],[3,2],[4,1],[5,2],[6,1],[7,1],[8,1],[9,1],[10,2],[15,2],[20,2],[25,2],[30,1],[35,1],[40,1],[50,1],[75,1]],2],[[[1,5],[2,3],[3,2],[4,1],[5,2],[6,1],[7,1],[8,1],[9,1],[10,2],[15,2],[20,2],[25,2],[30,1],[35,1],[40,1],[50,1]],1],[[[1,6],[16,1]],1],[[[1,5],[2,5],[3,1],[4,1],[5,1],[6,1],[7,1],[8,1],[9,1],[10,1],[11,1],[12,1],[13,1],[14,1],[15,1],[16,1],[17,1]],1],[[[1,3],[2,1],[3,1],[4,1],[5,1],[6,1],[7,1],[8,1],[9,1],[10,2],[12,2]],0],[[[1,8],[2,5],[3,4],[4,3],[5,2],[6,2],[7,2],[8,2],[9,2],[10,2],[11,1],[12,1],[13,1],[14,1],[15,1],[16,1],[17,1],[18,1],[19,1],[20,1],[21,1],[22,1],[23,1],[24,1],[25,1],[26,1],[27,1],[28,1],[29,1],[30,1],[31,1],[32,1],[33,1],[34,1],[35,1],[36,1],[37,1],[38,1],[39,1],[40,1]],3],[[[1,8],[2,5],[3,4],[4,3],[5,2],[6,2],[7,2],[8,2],[9,2],[10,2],[11,1],[12,1],[13,1],[14,1],[15,1],[16,1],[17,1],[18,1],[19,1],[20,1],[21,1],[22,1],[23,1],[24,1],[25,1],[26,1],[27,1],[28,1],[29,1],[30,1],[31,1],[32,1],[33,1],[34,1],[35,1],[36,1],[37,1],[38,1],[39,1],[40,1]],4],[[[1,8],[2,4],[3,4],[4,2],[5,2],[6,2],[7,2],[8,2],[9,2],[10,2],[11,2],[12,2],[13,2],[14,2],[15,2],[16,2],[17,6],[24,10]],4],[[[1,1000],[2,2],[3,2],[4,1],[5,1],[6,1],[7,1],[8,1],[9,1],[10,1],[11,1],[12,1],[13,1],[14,1],[15,1],[16,1],[17,3],[24,5]],1],[[[1,3],[2,2],[3,2],[4,1],[5,1],[6,1],[7,1],[8,1],[9,1],[10,1],[11,1],[12,1],[13,1],[14,1],[15,1],[16,1],[17,1],[19,1],[21,1],[23,1],[25,1]],1],[[[1,4],[2,2],[3,2],[4,1],[5,1],[6,1],[7,1],[8,1],[9,1],[10,1],[11,1],[12,1],[13,1],[14,1],[15,1],[16,1],[17,1],[18,1],[19,1],[20,1],[21,1],[22,1],[23,1],[24,1],[25,1],[30,1],[35,1]],3],[[[1,1000],[2,2],[3,2],[4,1],[5,1],[6,1],[7,1],[8,1],[9,1],[10,1],[11,1],[12,1],[13,1],[14,1],[15,1],[16,1],[17,1],[18,1],[19,1],[20,1],[21,1],[22,1],[23,1],[24,1],[25,1],[30,1],[35,1]],3],[[],1],[[[1,6],[2,3],[3,2],[4,2],[5,2],[6,1],[7,1],[8,1],[9,1],[10,1],[11,1],[12,1],[13,1],[14,1],[15,1],[16,1],[17,1],[19,1],[20,1]],1],[[[1,3],[2,2],[3,2],[4,1],[5,12],[6,1],[7,1],[8,1],[9,1],[10,1],[11,1],[12,1],[13,1],[14,1],[15,1],[16,1],[17,1],[19,1],[21,1],[23,1],[25,1]],3],[[[1,3],[2,1],[3,1],[4,1],[5,1],[6,1],[7,1],[8,1],[9,1],[10,1],[11,1],[12,1],[13,1],[14,1],[15,1],[16,1],[17,1],[18,1],[19,1],[20,1],[21,1],[22,1],[23,1],[24,1],[25,1],[30,1],[35,4]],2],[[[1,1000],[2,1],[3,1],[4,1],[5,1],[6,1],[7,1],[8,1],[9,1],[10,1],[11,1],[12,1],[13,1],[14,1],[15,1],[16,1],[17,1],[18,1],[19,1],[20,1],[21,1],[22,1],[23,1],[24,1],[25,1],[30,1],[35,4]],2],[[[1,4],[2,1]],0],[[[1,25]],1],[[[1,3],[2,1],[3,1],[4,1],[5,1],[6,1],[7,1],[8,1],[9,1],[10,1],[11,1],[12,1],[13,1],[14,1],[15,1],[16,1],[17,1],[19,1],[21,1],[23,1],[24,1],[25,1],[30,1],[35,4]],2],[[[1,9],[2,4],[3,4],[4,4],[5,4],[6,2],[7,2],[8,2],[9,2],[10,2],[11,2],[12,2],[13,2],[14,2],[15,2],[16,2],[17,2],[18,2],[19,2],[20,2],[21,2],[22,2],[23,2],[24,2],[25,2]],2],[[[1,9],[2,4],[3,4],[4,4],[5,4],[6,2],[7,2],[8,2],[9,2],[10,2],[11,2],[12,2],[13,2],[14,2],[15,2],[16,2],[17,2],[18,2],[19,2],[20,2],[21,2],[22,2],[23,2],[24,2],[25,2]],1],[[[1,9],[2,4],[3,4],[4,4],[5,4],[6,2],[7,2],[8,2],[9,2],[10,2],[11,2],[12,2],[13,2],[14,2],[15,2],[16,2],[17,2],[18,2],[19,2],[20,2]],2],[[[1,5],[2,3],[3,2],[4,1],[5,2],[6,1],[7,1],[8,1],[9,1],[10,2],[15,2],[20,2],[25,1],[30,1],[35,1],[40,1],[50,1],[75,1]],1],[[[1,9],[2,4],[3,4],[4,4],[5,4],[6,2],[7,2],[8,1],[9,2],[10,2],[11,2],[12,2],[13,2],[14,2],[15,2],[16,2],[17,2],[18,2],[19,2],[20,2],[21,2],[22,2],[23,2],[24,2],[25,2]],1],[[[1,1000],[2,4],[3,4],[4,4],[5,4],[6,2],[7,2],[8,2],[9,2],[10,2],[11,2],[12,2],[13,2],[14,2],[15,2],[16,2],[17,2],[18,2],[19,2],[20,2],[21,2],[22,2],[23,2],[24,2],[25,2]],4],[[[1,1]],0],[[[1,5],[2,2],[3,2],[4,1],[5,2],[6,1],[7,1],[8,1],[9,1],[10,1],[11,1],[12,1],[16,1],[20,2],[25,1],[30,1],[35,1]],1],[[[1,5],[2,2],[3,2],[4,1],[5,2],[6,1],[7,1],[8,1],[9,1],[10,1],[11,1],[12,1],[16,1],[20,2],[25,1],[30,1],[35,1]],2],[[[1,9],[2,4],[3,4],[4,4],[5,4],[6,2],[7,2],[8,1],[9,2],[10,2],[11,2],[12,2],[13,2],[14,2],[15,2],[16,2],[17,2],[18,2],[19,2],[20,2]],2],[[[1,9],[2,4],[3,4],[4,4],[5,4],[6,2],[7,2],[8,1],[9,2],[10,2],[11,2],[12,2],[13,2],[14,2],[15,2],[16,2],[17,2],[18,2],[19,2],[20,2],[21,2],[22,2],[23,2],[24,2],[25,2]],2],[[[1,3],[2,2],[3,2],[4,1],[5,1],[6,1],[7,1],[8,1],[9,1],[10,1],[15,1],[16,1],[17,1],[19,1],[21,1],[23,1],[25,1]],1],[[[1,9],[2,5],[3,4],[4,4],[5,4],[6,2],[7,2],[8,2],[9,2],[10,2],[11,2],[12,2],[13,2],[14,2],[15,2],[16,2],[17,2],[18,2],[19,2],[20,2],[21,2],[22,2],[23,2],[24,2],[25,2]],2],[[[1,5],[2,3],[3,2],[4,1],[5,2],[6,1],[7,1],[8,1],[9,1],[10,1],[11,1],[12,1],[13,1],[14,1],[15,1],[16,1],[17,1],[18,1],[19,1],[20,1],[21,1],[25,1]],1],[[[1,5],[2,3],[3,2],[4,1],[5,2],[6,1],[7,1],[8,1],[9,1],[10,1],[11,1],[12,1],[13,1],[14,1],[15,1],[16,1],[17,1],[18,1],[19,1],[20,1],[21,1],[25,1]],2],[[[1,5],[2,3],[3,2],[4,1],[5,2],[6,1],[7,1],[8,1],[9,1],[10,2],[15,2],[20,4],[30,1],[35,1],[40,1],[50,1],[75,1]],1],[[],5],[[[1,65]],0],[[[1,9],[2,4],[3,4],[4,4],[5,4],[6,2],[7,2],[8,2],[9,2],[10,2],[11,2],[12,2],[13,2],[14,2],[15,2],[16,2],[17,2],[18,2],[19,2],[20,2],[21,2],[22,2],[23,2],[24,2],[25,2],[30,2]],2],[[[1,10],[2,7],[3,5],[4,5],[5,5],[6,3],[7,3],[8,3],[9,3],[10,3],[15,3],[20,3],[25,2],[30,2],[35,2],[40,2],[50,2],[60,2],[75,2]],2],[[[1,10],[2,7],[3,5],[4,5],[5,5],[6,2],[7,2],[8,2],[9,2],[10,2],[11,2],[12,2],[13,2],[14,2],[15,4],[16,2],[17,2],[18,2],[19,2],[20,2]],2],[[[1,10],[2,7],[3,5],[4,5],[5,5],[6,3],[7,3],[8,3],[9,3],[10,3],[15,3],[20,3],[25,2],[30,2],[35,2],[40,2],[50,2],[75,2]],2],[[[1,10],[2,7],[3,5],[4,5],[5,5],[6,2],[7,2],[8,2],[9,2],[10,2],[11,2],[12,2],[13,2],[14,2],[15,2],[16,2],[17,2],[18,2],[19,2],[20,2]],2],[[[1,9],[2,4],[3,4],[4,4],[5,4],[6,2],[7,2],[8,2],[9,2],[10,2],[11,2],[12,2],[13,2],[14,2],[15,2],[16,2],[17,2],[18,2],[19,2],[20,2],[21,2],[22,2],[23,2],[24,2],[25,2]],0],[[[1,10],[2,7],[3,5],[4,5],[5,5],[6,2],[7,2],[8,2],[9,2],[10,2],[11,2],[12,2],[13,2],[14,2],[15,2],[16,2],[17,2],[18,2],[19,2],[20,2]],1],[[[1,11],[2,6],[3,4],[4,4],[5,4],[6,3],[7,3],[8,3],[9,3],[10,3],[11,3],[12,3],[13,3],[14,3],[15,3],[16,3],[17,3]],1],[[[1,10],[2,7],[3,5],[4,5],[5,5],[6,3],[7,3],[8,3],[9,3],[10,3],[15,3],[20,3],[25,2],[30,2],[35,2],[40,2],[50,2],[75,2]],1],[[[1,10],[2,7],[3,5],[4,5],[5,5],[6,3],[7,3],[8,3],[9,3],[10,3],[15,3],[20,3],[25,2],[30,2],[35,2],[40,2],[50,2],[75,2]],4],[[[1,5],[2,2],[3,2],[4,1],[5,1],[6,1],[7,1],[8,1],[9,1]],[[4,1],[8,1],[12,1]]],[[[1,5],[2,2],[3,2],[4,1],[5,1],[6,1],[7,1],[8,1],[9,1]],1],[[[1,10],[2,4],[3,4],[4,4],[5,4],[6,4],[7,2],[8,2],[9,2],[10,2],[11,2],[12,2],[13,2],[14,2],[15,2],[16,2],[17,2],[18,2],[19,2],[20,2],[21,2],[22,2],[23,2],[24,2],[25,4]],4],[[[1,11],[2,6],[3,4],[4,4],[5,4],[6,3],[7,3],[8,3],[9,3],[10,3],[11,3],[12,3],[13,3],[14,3],[15,3],[16,3],[17,3]],2],[[[1,11],[2,6],[3,4],[4,4],[5,4],[6,3],[7,3],[8,3],[9,3],[10,3],[11,3],[12,3],[13,3],[14,3],[15,3],[16,3],[17,3]],3],[[[1,946],[2,6],[3,4],[4,4],[5,4],[6,3],[7,3],[8,3],[9,3],[10,3],[11,3],[12,3],[13,3],[14,3],[15,3],[16,3],[17,3]],3],[[[1,1000]],0],[[[1,10],[2,7],[3,5],[4,5],[5,5],[6,3],[7,3],[8,3],[9,3],[10,3],[15,3],[20,3],[25,2],[30,2],[35,2],[40,2],[50,1],[75,3]],1],[[[1,10],[2,7],[3,5],[4,5],[5,5],[6,3],[7,3],[8,3],[9,3],[10,3],[15,3],[20,3],[25,2],[30,2],[35,2],[40,2],[50,1],[75,3]],4],[[[1,10],[2,7],[3,5],[4,5],[5,5],[6,3],[7,3],[8,3],[9,3],[10,3],[15,3],[20,3],[25,2],[30,2],[35,2],[40,2],[50,1],[75,3]],2],[[[10,50]],1],[[[1,9],[2,4],[3,4],[4,4],[5,4],[6,2],[7,2],[8,2],[9,2],[10,2],[11,2],[12,2],[13,2],[14,2],[15,2],[16,2],[17,2],[18,2],[19,2],[20,2],[21,2],[22,2],[23,2],[24,2],[25,2]],3],[[[1,7],[2,5],[3,4],[4,3],[5,2],[6,2],[7,2],[8,2],[9,1],[10,1],[11,1],[12,1],[13,1],[14,1],[15,1],[16,1]],0],[[[1,6],[2,4],[3,3],[4,2],[5,1],[6,1],[7,1],[8,1],[9,1],[10,1],[11,1],[12,1]],1],[[[1,10],[2,5],[3,5],[4,5],[5,5],[6,3],[7,3],[8,3],[9,3],[10,3],[11,3],[12,3],[13,3],[14,3],[15,3]],1],[[[1,3],[2,2],[3,2],[4,2],[5,1],[6,1],[7,1],[8,1],[9,1],[10,1],[11,1],[12,1],[13,1],[14,1],[15,1],[16,1]],1],[[[1,10],[2,8],[3,6],[4,4],[5,4],[6,4],[7,4],[8,4],[9,4],[10,4],[11,4],[12,4]],2],[[[1,10],[2,8],[3,6],[4,4],[5,4],[6,4],[7,4],[8,4],[9,4],[10,4],[11,4],[12,4]],3],[[[1,10],[2,5],[3,5],[4,5],[5,5],[6,3],[7,3],[8,3],[9,3],[10,3],[11,3],[12,3],[13,3],[14,3],[15,3]],3],[[[1,10],[2,5],[3,5],[4,5],[5,5],[6,3],[7,3],[8,3],[9,3],[10,3],[11,3],[12,3],[13,3],[14,3],[15,3]],2],[[[1,947],[2,4],[3,2],[4,1],[5,1],[6,1],[7,1],[8,1],[9,1],[10,1],[11,1],[12,1],[13,1],[14,1],[15,1],[16,1],[17,1],[18,1],[19,1],[20,1],[21,1],[22,1],[23,1],[24,1],[25,1],[26,1],[27,1],[28,1],[29,1],[30,1],[31,1],[32,1],[33,1],[34,1],[35,1],[36,1],[37,1],[38,1],[39,1],[40,1],[41,1],[42,1],[43,1],[44,1],[45,1],[46,1],[47,1],[48,1],[49,1],[50,1]],3],[[[1,3],[2,2],[3,2],[4,2],[5,2],[6,2],[7,2],[8,2],[9,1],[10,1],[11,1],[12,1],[13,1],[14,1],[15,1],[16,1]],1],[[[1,7],[2,4],[3,2],[4,1],[5,1],[6,1],[7,1],[8,1],[9,1],[10,1],[11,1],[12,1],[13,1],[14,1],[15,1],[16,1],[17,1],[18,1],[19,1],[20,1],[21,1],[22,1],[23,1],[24,1],[25,1],[26,1],[27,1],[28,1],[29,1],[30,1],[31,1],[32,1],[33,1],[34,1],[35,1],[36,1],[37,1],[38,1],[39,1],[40,1],[41,1],[42,1],[43,1],[44,1],[45,1],[46,1],[47,1],[48,1],[49,1],[50,1]],1],[[[1,944],[2,4],[3,4],[4,4],[5,4],[6,2],[7,2],[8,2],[9,2],[10,2],[11,2],[12,2],[13,2],[14,2],[15,2],[16,2],[17,2],[18,2],[19,2],[20,2],[21,2],[22,2],[23,2],[24,2],[25,2]],3],[[[1,944],[2,4],[3,4],[4,4],[5,4],[6,2],[7,2],[8,2],[9,2],[10,2],[11,2],[12,2],[13,2],[14,2],[15,2],[16,2],[17,2],[18,2],[19,2],[20,2],[21,2],[22,2],[23,2],[24,2],[25,2]],0],[[[1,3],[2,2],[3,2],[4,2],[5,2],[6,2],[7,2],[8,2],[9,1],[10,1],[11,1],[12,1],[13,1],[14,1],[15,1],[16,1]],2],[[[1,9],[2,4],[3,4],[4,4],[5,4],[6,2],[7,2],[8,2],[9,2],[10,2],[11,2],[12,2],[13,2],[14,3],[15,2],[16,2],[17,2],[18,2],[19,2],[20,2],[21,2],[22,2],[23,2],[24,2],[25,2]],2],[[[1,1],[2,1],[3,1],[4,1],[5,1],[6,1],[7,1],[8,1],[9,1],[10,1],[11,1],[12,1],[13,1],[14,1],[15,1],[16,1],[17,1],[18,1],[19,1],[20,1]],1],[[[1,10],[2,8],[3,6],[4,4],[5,4],[6,4],[7,4],[8,4],[9,4],[10,4],[11,4],[12,4]],1],[[[1,6],[2,4],[3,4],[4,3],[5,3],[6,3],[7,3],[8,3],[9,3],[10,3],[11,2],[12,2],[13,2],[14,2],[15,2],[16,1],[17,1],[18,1],[19,1],[20,1],[21,1],[22,1],[23,1],[24,1],[25,1],[26,1],[27,1],[28,1],[29,1],[30,1]],2],[[[1,7],[2,5],[3,5],[4,4],[5,4],[6,3],[7,3],[8,3],[9,2],[10,2],[11,2],[12,2],[13,2],[14,2],[15,2],[16,2]],1],[[[1,10],[2,6],[3,4],[4,4],[5,4],[6,4],[7,4],[8,4],[9,4],[10,4],[11,4],[12,2],[13,2],[14,2],[15,2]],0],[[[1,6],[2,4],[3,4],[4,4],[5,4],[6,4],[7,4]],1],[[[1,7],[2,5],[3,5],[4,4],[5,4],[6,3],[7,3],[8,3],[9,2],[10,2],[11,2],[12,2],[13,2],[14,2],[15,2]],1],[[[0,10]],0],[[[1,4],[2,3],[3,3],[5,3],[10,2],[15,2],[20,2],[25,2],[30,2]],2]];
const CC_CUP_SCORE={"Acrocanthosaurus_Official":[0,-1,0,0],"ArchitectPopUpDuoEU":[1,-1,30,0],"ArchitectPopUpSoloEU":[1,-1,30,0],"ArchitectPopUpSquadEU":[1,-1,30,0],"BambiRaptor":[2,-1,0,0],"BlackheartCup":[4,-1,10,0],"Bratwurst_Official":[2,-1,0,0],"CashCup_Trios1":[6,-1,10,0],"CashCup_Trios2":[7,-1,10,0],"Dinosauron_Official":[8,-1,0,0],"LuxeCup":[9,-1,10,0],"MannekenPis_Official":[2,-1,0,0],"ONSITE_WorldCup_Duos":[10,10,0,0],"ONSITE_WorldCup_ProAm":[10,10,0,0],"ONSITE_WorldCup_Solos":[4,4,0,0],"ONSITE_Worldcup_Creative":[11,11,0,0],"OnlineOpen_Week10":[10,-1,10,0],"OnlineOpen_Week1":[4,-1,10,0],"OnlineOpen_Week2":[10,-1,10,0],"OnlineOpen_Week3":[4,-1,10,0],"OnlineOpen_Week4":[10,-1,10,0],"OnlineOpen_Week5":[4,-1,10,0],"OnlineOpen_Week6":[10,-1,10,0],"OnlineOpen_Week7":[4,-1,10,0],"OnlineOpen_Week8":[10,-1,10,0],"OnlineOpen_Week9":[4,-1,10,0],"S10_CC_Champions":[4,-1,15,0],"S10_CC_Contenders":[4,-1,15,0],"S10_CC_Trios":[12,-1,15,0],"S10_FNCS_Finals":[12,-1,6,0],"S10_FNCS_Week1":[12,-1,10,0],"S10_FNCS_Week2":[12,-1,10,0],"S10_FNCS_Week3":[12,-1,10,0],"S10_FNCS_Week4":[12,-1,10,0],"S10_FNCS_Week5":[12,-1,10,0],"S11_CC_Contenders":[4,-1,10,0],"S11_CelebrationCup":[4,-1,10,0],"S11_DreamhackWinter_BYOC":[13,-1,10,0],"S11_FNCS_Finals":[14,-1,6,0],"S11_FNCS_Warmup":[14,-1,10,0],"S11_FNCS_Week1":[14,-1,10,0],"S11_FNCS_Week2":[14,-1,10,0],"S11_FNCS_Week3":[14,-1,10,0],"S11_FNCS_Week4":[14,-1,10,0],"S11_FNF":[12,-1,10,0],"S11_HypeNight":[4,-1,10,0],"S11_PlatformCup_Console":[4,-1,10,0],"S11_PlatformCup_Mobile":[4,-1,10,0],"S11_PlatformCup_PC":[4,-1,10,0],"S11_WinterRoyale_Console":[15,-1,15,0],"S11_WinterRoyale_Mobile":[15,-1,15,0],"S11_WinterRoyale_PC":[15,-1,15,0],"S12_BenjyFishyCup_Round1":[17,-1,10,0],"S12_BenjyFishyCup_Round2":[18,18,0,10],"S12_CCV2_Contenders":[19,19,0,10],"S12_CCV2_Platform":[21,21,0,6],"S12_CC_Contenders":[10,-1,10,0],"S12_CC_Platform":[4,-1,10,0],"S12_DailyDuos":[22,-1,10,0],"S12_DoigbyCup":[10,-1,4,0],"S12_FNCS_Finals_Console":[10,-1,6,0],"S12_FNCS_Finals_PC":[10,-1,6,0],"S12_FNCS_Invitational":[23,-1,6,0],"S12_FNCS_Warmup":[10,-1,10,0],"S12_FNCS_Week1":[10,-1,10,0],"S12_FNCS_Week2":[10,-1,10,0],"S12_FNCS_Week3":[10,-1,10,0],"S12_FNCS_Week4":[10,-1,10,0],"S12_HypeNight":[4,-1,10,0],"S12_PiazzDuos":[22,-1,10,0],"S13_AmarTriosCup":[24,-1,10,0],"S13_AquaNyhroxThrowbackCup":[26,-1,12,0],"S13_BlueFlatline_EUNAE_Contender":[28,-1,1,0],"S13_BughaThrowbackCup":[29,-1,12,0],"S13_CC_Champions":[31,-1,10,0],"S13_CC_Contenders":[31,-1,10,0],"S13_CC_Platform":[32,-1,10,0],"S13_DailyHypeCup":[32,-1,10,0],"S13_DailyTrios":[33,-1,10,0],"S13_DoigCupTrios":[34,-1,5,0],"S13_Dreamhack_August":[35,35,10,6],"S13_Dreamhack_July":[35,35,10,8],"S13":[36,-1,20,0],"S13_FNCS":[32,32,7,7],"S13_FreeFortniteCup":[37,-1,12,0],"S13_GalaxyCupSolo":[4,-1,10,0],"S13_HypeNight":[32,-1,10,0],"S13_HypeNight_Plus":[32,-1,10,0],"S13_JacobSoloCup":[38,-1,6,0],"S13_LlobetiTriosCup":[24,-1,10,0],"S13_MongraalSoloCup":[39,-1,10,0],"S13_MrSavageTriosCup":[24,-1,10,0],"S13_RaiseTheCup":[41,-1,10,0],"S13_TwoPlayersOneConsole":[42,-1,10,0],"S14_BlackWidowCup":[43,-1,10,0],"S14_CC_Champions":[31,-1,10,0],"S14_CC_Contenders":[31,-1,10,0],"S14_CC_Platform":[32,-1,10,0],"S14_DaredevilCup":[43,-1,10,0],"S14_Dreamhack_November":[44,44,10,6],"S14_Dreamhack_October":[35,35,10,6],"S14_Dreamhack_September":[35,19,10,6],"S14_EUEncore":[25,-1,10,0],"S14_FNCS_Finals":[45,-1,6,0],"S14_FNCS_Qualifier1":[45,-1,10,0],"S14_FNCS_Qualifier2":[45,-1,10,0],"S14_FNCS_Qualifier3":[45,-1,10,0],"S14_FNCS_Warmup":[45,-1,10,0],"S14_GhostRiderCup":[43,-1,10,0],"S14_HypeNite":[47,-1,10,0],"S14_LachlanPickaxeFrenzy":[24,-1,10,0],"S14_MarvelSuperCup":[48,-1,10,0],"S14_Season4HypeCup":[47,-1,10,0],"S14_VenomCup":[43,-1,10,0],"S14_WildWednesday":[49,-1,10,0],"S15_ACMilanCup":[50,-1,7,0],"S15_ASRomaCup":[50,-1,7,0],"S15_BhangraBoogieCup":[51,-1,10,0],"S15_CashCup":[52,-1,10,0],"S15_CyprusCup":[53,-1,10,0],"S15_Dreamhack_December":[44,44,10,6],"S15_Dreamhack_January":[44,44,10,8],"S15_FNCS_GrandFinals":[54,54,6,6],"S15_FNCS_Qualifier1":[45,-1,10,0],"S15_FNCS_Qualifier2":[45,-1,10,0],"S15_FNCS_Qualifier3":[45,-1,10,0],"S15_FNCS_RebootRound":[55,-1,1,0],"S15_FNCS_SemiFinals":[54,-1,6,0],"S15_FazeCityCup":[50,-1,7,0],"S15_FlashCup":[53,-1,10,0],"S15_FloorIsLavaLTM":[56,-1,10,0],"S15_FridayNiteBraggingRights":[45,-1,10,0],"S15_FrostyFrenzy":[45,57,6,10],"S15_GrefGSolo":[58,-1,12,0],"S15_GrefGSquads":[59,-1,12,0],"S15_HeartsWildCup":[53,-1,10,0],"S15_HypeCup":[52,-1,10,0],"S15_InterMilanCup":[50,-1,7,0],"S15_LazarAndFreshSuperKnockback":[60,-1,10,0],"S15_OneShotLTM":[61,-1,10,0],"S15_PSGenerationsCup":[62,-1,10,0],"S15_PeleCup":[50,-1,10,0],"S15_RagsToRichesLTM":[61,-1,10,0],"S15_SolidGoldLTM":[61,-1,10,0],"S15_SoloCashCup":[61,-1,10,0],"S15_SwitchCup3":[63,-1,10,0],"S15_TrinityCup":[64,-1,10,0],"S16_AloyCup":[60,-1,10,0],"S16_CashCupExtraDH":[65,-1,10,0],"S16_CashCup":[52,-1,10,0],"S16_CloseEncountersLTM":[66,-1,10,0],"S16_ConsoleChampionsCup":[45,-1,10,0],"S16_DeathstrokeCup":[66,-1,10,0],"S16_Dreamhack_April":[68,69,10,10],"S16_EliteScrims":[70,-1,6,0],"S16_FNCS_Finals":[67,67,6,6],"S16_FNCS_Qualifier1":[45,-1,10,0],"S16_FNCS_Qualifier2":[45,-1,10,0],"S16_FNCS_Qualifier3":[45,-1,10,0],"S16_FNCS_RebootRound":[55,-1,3,0],"S16_FNCS_SemiFinals":[67,-1,6,0],"S16_FloorIsLavaSoloLTM":[66,-1,10,0],"S16_FridayNiteBraggingRights":[45,-1,10,0],"S16_HighExplosivesLTM":[66,-1,10,0],"S16_HypeCup":[52,-1,10,0],"S16_NeymarJrCup":[66,-1,10,0],"S16_OneShotLTM":[66,-1,10,0],"S16_OpenScrims":[70,-1,6,0],"S16_SoloCashCup":[66,-1,10,0],"S16_SpringBreakoutCup":[53,-1,10,0],"S16_TeenTitansCup":[71,-1,10,0],"S16_UEFA_Euro_Cup_2020":[17,-1,10,0],"S17_BlueCheese":[24,-1,10,0],"S17_CammyCup":[53,-1,10,0],"S17_CashCupExtraDH":[65,-1,10,0],"S17_CashCup":[45,-1,10,0],"S17_ConsoleChampionsCup":[45,-1,10,0],"S17_Dreamhack_August":[73,68,10,10],"S17_FNCS_Finals":[67,67,6,8],"S17_FNCS_Qualifier1":[45,-1,10,0],"S17_FNCS_Qualifier2":[45,-1,10,0],"S17_FNCS_Qualifier3":[45,-1,10,0],"S17_FNCS_RebootRound":[55,-1,4,0],"S17_FNCS_SemiFinals":[67,-1,6,0],"S17_FNCS_SoloFinals":[74,-1,6,0],"S17_FNCS_SoloPlayIns":[66,-1,10,0],"S17_FloorIsLavaSoloLTM":[75,-1,10,0],"S17_GalaxyCup":[76,-1,25,0],"S17_GamoraCup":[53,-1,10,0],"S17_HypeCup":[52,-1,10,0],"S17_JBalvinCup":[53,-1,10,0],"S17_OneShotLTM":[66,-1,10,0],"S17_PickaxeFrenzyLTM":[77,-1,10,0],"S17_SoloCashCup":[66,-1,10,0],"S17_SuperKnockBackLTM":[66,-1,10,0],"S17_ThanosCup":[53,-1,10,0],"S17_WonderWomanCup":[53,-1,10,0],"S17_ZoneWarsLTM":[78,-1,10,0],"S18_BlueCheese":[24,-1,12,0],"S18_BlueCheese_Quick_Cup_Solo":[79,-1,12,0],"S18_BlueCheese_Quick_Cup_Trios":[24,-1,12,0],"S18_BlueCheese_Solo":[79,-1,12,0],"S18_CashCupExtraDH":[65,-1,6,0],"S18_CashCup":[45,-1,10,0],"S18_ConsoleChampionsCup":[45,-1,10,0],"S18_Dreamhack_October":[73,68,10,10],"S18_DuosHypeCup":[53,-1,10,0],"S18_FNCS_Finals":[67,67,6,8],"S18_FNCS_Qualifier1":[45,-1,10,0],"S18_FNCS_Qualifier2":[45,-1,10,0],"S18_FNCS_SemiFinals_Day1":[67,-1,4,0],"S18_FNCS_SemiFinals_Day2":[55,-1,6,0],"S18_FloorRestoresLTM":[53,-1,10,0],"S18_GrandRoyaleCommunityCup":[45,-1,10,0],"S18_GrandRoyale_Finals":[67,81,6,6],"S18_GrandRoyale_Load":[45,-1,10,0],"S18_GrandRoyale_Reload":[45,-1,10,0],"S18_GrandRoyale_VictoryPath":[82,-1,8,0],"S18_PlaystationCup":[66,-1,10,0],"S18_PreseasonWarmup":[45,-1,10,0],"S18_SoloCashCup":[66,-1,10,0],"S18_TriosHypeCup":[52,-1,10,0],"S19_AllValleyCup":[66,-1,10,0],"S19_ConsoleChampionsCup":[83,83,10,7],"S19_DuosCashCup":[83,84,10,6],"S19_DuosHypeCup_Contender":[83,84,10,6],"S19_DuosHypeCup_Open":[83,84,10,6],"S19_FNCSCommunityCup":[83,-1,10,0],"S19_FNCS_Finals":[84,84,6,6],"S19_FNCS_Qualifier1":[83,83,10,7],"S19_FNCS_Qualifier2":[83,83,10,10],"S19_FNCS_SemiFinals":[85,85,5,5],"S19_LCBestOf":[83,-1,7,0],"S19_LCHighScore":[83,-1,99,0],"S19_PlaystationCupMarch":[83,-1,10,0],"S19_PlaystationCup":[66,74,10,6],"S19_SilkSonicCup":[83,-1,10,0],"S19_SoloCashCup":[66,74,10,6],"S19_SoloHypeCup_Contender":[66,74,10,6],"S19_SoloHypeCup_Open":[66,74,10,6],"S19_ThriveCup":[66,-1,10,0],"S19_TriosHypeCup_Champion":[52,-1,10,0],"S19_TriosHypeCup_Contender":[52,-1,10,0],"S19_TriosHypeCup_Open":[52,-1,10,0],"S20_AliaACup":[83,-1,10,0],"S20_AndroidStreetFighterCup":[66,-1,10,0],"S20_ChicaCup":[83,-1,10,0],"S20_ChloeKimCup":[83,-1,10,0],"S20_ConsoleChampionsCup":[83,83,10,10],"S20_DuosCashCup":[83,84,10,6],"S20_DuosHypeCup_Contender":[83,84,10,6],"S20_DuosHypeCup_Open":[83,84,10,6],"S20_FNCSCommunityCup":[83,-1,10,0],"S20_FNCS_Finals":[84,84,6,6],"S20_FNCS_Qualifier1":[83,83,10,10],"S20_FNCS_Qualifier2":[83,83,10,10],"S20_FNCS_Qualifier3":[83,83,10,10],"S20_FNCS_SemiFinals":[85,85,5,6],"S20_LCArchitectDuos":[83,-1,7,0],"S20_LCElegantWeaponsDuos":[83,-1,7,0],"S20_LCElimOnlyDuos":[86,-1,7,0],"S20_LCElimOnlyHighScoreDuos":[86,86,99,99],"S20_LCElimOnlyHighScoreTrios":[86,86,99,99],"S20_LCElimOnlySolo":[86,-1,7,0],"S20_LCMicroSessionsDuos":[83,83,99,99],"S20_LCMicroSessionsTriosZBM":[52,52,99,99],"S20_LCNoBuildDuos":[83,-1,7,0],"S20_LCNoBuildSquads":[87,-1,7,0],"S20_LCStartingLoadoutDuos":[83,-1,7,0],"S20_LCStartingLoadoutSolos":[66,-1,7,0],"S20_LCSuperBlitzDuos":[83,-1,7,0],"S20_ObiWanCup":[83,-1,10,0],"S20_PlaystationCupApril_Round1":[66,-1,10,0],"S20_PlaystationCupMay":[83,83,0,10],"S20_SoloCashCup":[66,74,10,6],"S20_SoloHypeCup_Contender":[66,74,10,6],"S20_SoloHypeCup_Open":[66,74,10,6],"S20_StreetFighterCup":[66,-1,10,0],"S20_TriosHypeCup_Champion":[52,-1,10,0],"S20_TriosHypeCup_Contender":[52,-1,10,0],"S21_ConsoleChampionsCupZBM":[83,83,10,10],"S21_ConsoleChampionsCup":[83,83,10,10],"S21_DreamerCup":[59,-1,10,0],"S21_DreamhackSummer":[72,35,10,6],"S21_DreamhackSummerZBM":[72,35,10,6],"S21_DuosCashCup":[83,89,10,6],"S21_DuosHypeCup_Contender":[84,-1,10,0],"S21_DuosHypeCup_Open":[84,-1,10,0],"S21_FNCS_Finals":[89,89,6,6],"S21_FNCS_Qualifier1":[83,83,10,10],"S21_FNCS_Qualifier2":[83,83,10,10],"S21_FNCS_Qualifier3":[83,83,10,10],"S21_FNCS_SemiFinals":[90,90,5,6],"S21_GalaxyCup":[66,-1,7,0],"S21_JewelRush":[91,-1,0,0],"S21_LCArchitectSolo":[66,-1,7,0],"S21_LCElimOnlyHighScoreDuos":[86,-1,7,0],"S21_LCElimOnlyHighScoreZBMSquads":[86,-1,7,0],"S21_LCHotDropDuos":[83,-1,7,0],"S21_LCNoSweatDuos":[92,-1,7,0],"S21_LCNoSweatSolo":[92,-1,7,0],"S21_LCNoSweatSquadsZBM":[92,-1,8,0],"S21_LCNoSweatTrios":[92,-1,7,0],"S21_LCQuickCupTriosZBM":[45,67,5,3],"S21_LCQuickCup":[83,89,5,3],"S21_LCStartingLoadoutDuos":[83,-1,7,0],"S21_LCStartingLoadoutSolo":[66,-1,7,0],"S21_LCTargetPracticeDuos":[83,-1,7,0],"S21_LCWildStormDuos":[83,-1,7,0],"S21_LGSoloCashCup":[79,80,12,10],"S21_LGSoloQuickCup":[79,-1,12,0],"S21_LGSolosQuickCup_BR":[24,-1,12,0],"S21_LGSolosQuickCup":[79,-1,12,0],"S21_LGSolosQuickCup_ME":[24,-1,12,0],"S21_LGTriosCashCup":[24,25,12,10],"S21_LGTriosQuickCup":[24,-1,12,0],"S21_PgodCup":[52,52,10,6],"S21_PlaystationCupAug":[66,74,10,6],"S21_PlaystationCupJuly":[66,74,10,6],"S21_PlaystationCupJune":[66,66,10,10],"S21_QuarterbackCup":[59,-1,10,0],"S21_SoloCashCupConsole":[66,74,10,6],"S21_SoloCashCup":[66,74,10,6],"S21_SoloHypeCup_Contender":[66,-1,10,0],"S21_SoloHypeCup_Open":[66,-1,10,0],"S21_SommersetCup":[83,-1,10,0],"S21_SuperHypeCup":[83,93,7,6],"S21_TournamentOfPower":[83,-1,10,0],"S21_TriosCashCupZBM":[45,67,6,3],"S21_TriosQuickCashCup":[52,-1,5,0],"S22_ConsoleChampionsCup":[83,83,10,10],"S22_DivisionalCups_Challenger":[94,-1,10,0],"S22_DivisionalCups_Contender":[95,-1,10,0],"S22_DivisionalCups_Elite":[94,-1,10,0],"S22_DivisionalCups_Elite_Finals":[2,-1,6,0],"S22_FNCSInvitationalCommunityCup":[83,-1,10,0],"S22_Invitational":[89,-1,6,0],"S22_PlacementCup":[95,-1,10,0],"S22_PlaystationCupNov":[66,74,10,6],"S22_PlaystationCupOct":[66,74,10,6],"S22_PlaystationCupSep":[66,74,10,6],"S22_PoloStadiumCup":[66,-1,10,0],"S22_QueasyCup":[52,52,10,6],"S22_SypherPKIconCup":[83,-1,10,0],"S22_ZBMCashCup":[96,-1,10,0],"S22_ZBMQuickCup":[94,-1,6,0],"S23_CreedCup":[97,-1,10,0],"S23_DivisionalCups_Challenger":[94,-1,10,0],"S23_DivisionalCups_Contender":[95,-1,10,0],"S23_DivisionalCups_Elite":[2,-1,10,0],"S23_DivisionalCups_Elite_Finals":[2,-1,6,0],"S23_DuosFillQuickCup":[98,-1,10,0],"S23_FNCS_CommunityCup":[83,-1,10,0],"S23_FNCS_Major1_GrandFinals":[2,-1,6,0],"S23_FNCS_Major1_SurgeWeek":[99,-1,5,0],"S23_FNCS_Major1_Week1":[2,2,10,6],"S23_FNCS_Major1_Week2":[2,2,10,6],"S23_FNCS_Major1_Week3":[2,2,10,6],"S23_LGSoloCashCup":[79,80,12,10],"S23_LGSoloQuickCup":[79,-1,12,0],"S23_LGTriosCashCup":[24,25,12,10],"S23_LGTriosQuickCup":[24,-1,12,0],"S23_PlacementCup":[95,-1,10,0],"S23_PlaystationCupFeb":[66,74,10,6],"S23_PlaystationCupJan":[66,74,10,6],"S23_SoloCashCup":[66,100,10,10],"S23_SuperFlakesCup":[83,-1,10,0],"S23_ThunderCup":[101,102,4,4],"S23_ZBMCashCup":[96,-1,10,0],"S23_ZBMQuickCupFill":[104,-1,6,0],"S23_ZBMQuickCup":[94,-1,6,0],"S23_thekidlaroi":[105,-1,10,0],"S24_ConsoleChampionsCupMay":[83,83,10,10],"S24_ConsoleChampionsCup":[83,83,10,10],"S24_DuosCashCup":[94,2,10,6],"S24_DuosFillQuickCup":[106,-1,7,0],"S24_FNCS_CommunityCup":[83,-1,10,0],"S24_FNCS_Major2_GrandFinals":[2,-1,6,0],"S24_FNCS_Major2_SurgeWeek":[99,-1,5,0],"S24_FNCS_Major2_Week1":[94,94,10,6],"S24_FNCS_Major2_Week2":[94,94,10,6],"S24_FNCS_Major2_Week3":[94,94,10,6],"S24_MamaBenjyFishy":[107,108,7,4],"S24_PlaystationCupMar":[66,74,10,6],"S24_RenegadeRunnerCupBuildZB":[83,-1,10,0],"S24_RenegadeRunnerCupBuild":[83,-1,10,0],"S24_SoloVictoryCup":[66,46,7,3],"S24_TriosZBVictoryCashCup":[107,46,7,3],"S24_ZBTriosFillQuickCup":[108,-1,10,0],"S25_ConsoleChampionsCup":[94,94,10,10],"S25_DuosCashCup":[94,2,10,6],"S25_DuosFillQuickCup":[2,-1,10,0],"S25_DuosZBVictoryCashCup":[94,46,7,3],"S25_FNCSCommunityCup":[94,-1,10,0],"S25_FNCS_LastChanceMajor":[94,2,10,6],"S25_FNCS_Major3_GrandFinals":[2,-1,6,0],"S25_FNCS_Major3_Week1":[94,94,10,6],"S25_FNCS_Major3_Week2":[94,94,10,6],"S25_FNCS_Major3_Week3":[94,94,10,6],"S25_GalaxyCup4Android":[109,-1,7,0],"S25_GalaxyCup4":[109,-1,7,0],"S25_JJKCup":[94,-1,10,0],"S25_PerfEvaluation":[95,94,7,4],"S25_PlaystationCupJune":[66,74,10,6],"S25_PlaystationCupZBJune":[66,74,10,6],"S25_SoloVictoryCashCup":[109,46,7,3],"S25_ZBDuosFillQuickCup":[94,-1,10,0],"S26_ConsoleChampionsCupZB":[2,2,10,10],"S26_ConsoleChampionsCup":[2,2,10,10],"S26_DuosCashCup":[94,2,10,6],"S26_DuosZBVictoryCashCup":[94,46,7,3],"S26_FNCSCommunityCup":[94,-1,10,0],"S26_MixUpMondaysBR":[92,-1,7,0],"S26_MixUpMondaysZB":[92,-1,7,0],"S26_PerfEvaluation":[95,94,7,4],"S26_PlaystationCupSeptember":[66,74,10,6],"S26_PlaystationCupZBSeptember":[66,74,10,6],"S26_SoloVictoryCashCup":[66,46,7,3],"S27_DuosZBVictoryCashCup":[94,46,7,3],"S27_OGAmar_Duos":[10,-1,10,0],"S27_OGGrefg_Duos":[10,-1,10,0],"S27_OGGrefg_Squads":[14,-1,10,0],"S27_OGInoxtag_Duos":[10,-1,10,0],"S27_OGJacob_Duos":[10,-1,10,0],"S27_RankedCupBronzeDuos":[112,-1,0,0],"S27_RankedCupBronzeSolo":[113,-1,0,0],"S27_RankedCupBronzeSquads":[114,-1,0,0],"S27_RankedCupDiamondDuos":[112,-1,0,0],"S27_RankedCupDiamondSolo":[113,-1,0,0],"S27_RankedCupDiamondSquads":[114,-1,0,0],"S27_RankedCupGoldDuos":[112,-1,0,0],"S27_RankedCupGoldSolo":[113,-1,0,0],"S27_RankedCupGoldSquads":[114,-1,0,0],"S27_RankedCupPlatinumDuos":[112,-1,0,0],"S27_RankedCupPlatinumSolo":[113,-1,0,0],"S27_RankedCupPlatinumSquads":[114,-1,0,0],"S27_RankedCupSilverDuos":[112,-1,0,0],"S27_RankedCupSilverSolo":[113,-1,0,0],"S27_RankedCupSilverSquads":[114,-1,0,0],"S27_RankedCupZBBronzeDuos":[112,-1,0,0],"S27_RankedCupZBBronzeSolo":[113,-1,0,0],"S27_RankedCupZBBronzeSquads":[114,-1,0,0],"S27_RankedCupZBDiamondDuos":[112,-1,0,0],"S27_RankedCupZBDiamondSolo":[113,-1,0,0],"S27_RankedCupZBDiamondSquads":[114,-1,0,0],"S27_RankedCupZBGoldDuos":[112,-1,0,0],"S27_RankedCupZBGoldSolo":[113,-1,0,0],"S27_RankedCupZBGoldSquads":[114,-1,0,0],"S27_RankedCupZBPlatinumDuos":[112,-1,0,0],"S27_RankedCupZBPlatinumSolo":[113,-1,0,0],"S27_RankedCupZBPlatinumSquads":[114,-1,0,0],"S27_RankedCupZBSilverDuos":[112,-1,0,0],"S27_RankedCupZBSilverSolo":[113,-1,0,0],"S27_RankedCupZBSilverSquads":[114,-1,0,0],"S27_SoloVictoryCashCup":[66,46,7,3],"S28_ConsoleCashCupsZB":[94,2,10,6],"S28_ConsoleCashCups":[94,2,10,6],"S28_DuosCashCup":[94,2,10,6],"S28_DuosZBVictoryCashCup":[94,46,7,3],"S28_FNCSCommunityCups":[94,-1,10,0],"S28_FNCS_Major1_GrandFinals":[2,-1,6,0],"S28_FNCS_Major1_Qualifier1":[94,94,10,10],"S28_FNCS_Major1_Qualifier2":[94,94,10,10],"S28_FNCS_Major1_SemiFinalLowerBracket":[2,2,10,10],"S28_FNCS_Major1_SemiFinalUpperBracket":[5,5,5,5],"S28_MixUpMondaysBR":[92,-1,7,0],"S28_MixUpMondaysZB":[92,-1,7,0],"S28_PerformanceEvaluation":[95,94,7,4],"S28_PlaystationCupDecember":[66,74,10,6],"S28_PlaystationCupZBDecember":[66,74,10,6],"S28_RankedCupBronzeDuos":[94,-1,0,0],"S28_RankedCupBronzeSolo":[115,-1,0,0],"S28_RankedCupBronzeSquads":[116,-1,0,0],"S28_RankedCupDiamondDuos":[94,-1,0,0],"S28_RankedCupDiamondSolo":[115,-1,0,0],"S28_RankedCupDiamondSquads":[116,-1,0,0],"S28_RankedCupGoldDuos":[94,-1,0,0],"S28_RankedCupGoldSolo":[115,-1,0,0],"S28_RankedCupGoldSquads":[116,-1,0,0],"S28_RankedCupPlatinumDuos":[94,-1,0,0],"S28_RankedCupPlatinumSolo":[115,-1,0,0],"S28_RankedCupPlatinumSquads":[116,-1,0,0],"S28_RankedCupSilverDuos":[94,-1,0,0],"S28_RankedCupSilverSolo":[115,-1,0,0],"S28_RankedCupSilverSquads":[116,-1,0,0],"S28_RankedCupZBBronzeDuos":[94,-1,0,0],"S28_RankedCupZBBronzeSolo":[115,-1,0,0],"S28_RankedCupZBBronzeSquads":[116,-1,0,0],"S28_RankedCupZBDiamondDuos":[94,-1,0,0],"S28_RankedCupZBDiamondSolo":[115,-1,0,0],"S28_RankedCupZBDiamondSquads":[116,-1,0,0],"S28_RankedCupZBGoldDuos":[94,-1,0,0],"S28_RankedCupZBGoldSolo":[115,-1,0,0],"S28_RankedCupZBGoldSquads":[116,-1,0,0],"S28_RankedCupZBPlatinumDuos":[94,-1,0,0],"S28_RankedCupZBPlatinumSolo":[115,-1,0,0],"S28_RankedCupZBPlatinumSquads":[116,-1,0,0],"S28_RankedCupZBSilverDuos":[94,-1,0,0],"S28_RankedCupZBSilverSolo":[115,-1,0,0],"S28_RankedCupZBSilverSquads":[116,-1,0,0],"S28_SoloVictoryCashCup":[66,46,7,3],"S29_ConsoleCashCupsZB":[94,2,10,6],"S29_ConsoleCashCups":[94,2,10,6],"S29_DuosCashCup":[94,2,10,6],"S29_DuosZBVictoryCashCup":[94,46,7,3],"S29_FNCSCommunityCups":[94,-1,10,0],"S29_FNCS_Major2_GrandFinals":[2,-1,6,0],"S29_FNCS_Major2_Qualifier1":[94,94,10,10],"S29_FNCS_Major2_Qualifier2":[94,94,10,10],"S29_FNCS_Major2_SemiFinalLowerBracket":[2,2,10,10],"S29_FNCS_Major2_SemiFinalUpperBracket":[5,5,5,5],"S29_MixUpMondaysBR":[92,-1,7,0],"S29_MixUpMondaysZB":[92,-1,7,0],"S29_PerformanceEvaluation":[117,100,7,4],"S29_PlaystationCupMarch":[66,74,10,6],"S29_PlaystationCupZBMarch":[66,74,10,6],"S29_RankedCupBronzeDuos":[94,-1,0,0],"S29_RankedCupBronzeSolo":[115,-1,0,0],"S29_RankedCupBronzeSquads":[116,-1,0,0],"S29_RankedCupDiamondDuos":[94,-1,0,0],"S29_RankedCupDiamondSolo":[115,-1,0,0],"S29_RankedCupDiamondSquads":[116,-1,0,0],"S29_RankedCupEliteDuos":[94,-1,0,0],"S29_RankedCupEliteSolo":[115,-1,0,0],"S29_RankedCupEliteSquads":[116,-1,0,0],"S29_RankedCupGoldDuos":[94,-1,0,0],"S29_RankedCupGoldSolo":[115,-1,0,0],"S29_RankedCupGoldSquads":[116,-1,0,0],"S29_RankedCupPlatinumDuos":[94,-1,0,0],"S29_RankedCupPlatinumSolo":[115,-1,0,0],"S29_RankedCupPlatinumSquads":[116,-1,0,0],"S29_RankedCupSilverDuos":[94,-1,0,0],"S29_RankedCupSilverSolo":[115,-1,0,0],"S29_RankedCupSilverSquads":[116,-1,0,0],"S29_RankedCupZBBronzeDuos":[94,-1,0,0],"S29_RankedCupZBBronzeSolo":[115,-1,0,0],"S29_RankedCupZBBronzeSquads":[116,-1,0,0],"S29_RankedCupZBDiamondDuos":[94,-1,0,0],"S29_RankedCupZBDiamondSolo":[115,-1,0,0],"S29_RankedCupZBDiamondSquads":[116,-1,0,0],"S29_RankedCupZBEliteDuos":[94,-1,0,0],"S29_RankedCupZBEliteSolo":[115,-1,0,0],"S29_RankedCupZBEliteSquads":[116,-1,0,0],"S29_RankedCupZBGoldDuos":[94,-1,0,0],"S29_RankedCupZBGoldSolo":[115,-1,0,0],"S29_RankedCupZBGoldSquads":[116,-1,0,0],"S29_RankedCupZBPlatinumDuos":[94,-1,0,0],"S29_RankedCupZBPlatinumSolo":[115,-1,0,0],"S29_RankedCupZBPlatinumSquads":[116,-1,0,0],"S29_RankedCupZBSilverDuos":[94,-1,0,0],"S29_RankedCupZBSilverSolo":[115,-1,0,0],"S29_RankedCupZBSilverSquads":[116,-1,0,0],"S29_RiseofMidasCup":[74,-1,10,0],"S29_SoloVictoryCashCup":[66,46,7,3],"S30_ConsoleCashCups":[94,2,10,6],"S30_DuosCashCupZB":[94,2,10,6],"S30_DuosCashCup":[94,2,10,6],"S30_FNCSCommunityCups":[94,-1,10,0],"S30_FNCS_Major3_GrandFinals":[2,-1,6,0],"S30_FNCS_Major3_Qualifier1":[94,94,10,10],"S30_FNCS_Major3_Qualifier2":[94,94,10,10],"S30_FNCS_Major3_SemiFinalLowerBracket":[2,2,10,10],"S30_FNCS_Major3_SemiFinalUpperBracket":[5,5,5,5],"S30_MetallicaCup":[118,-1,10,0],"S30_NickEh":[95,-1,10,0],"S30_OpenDuosCupBR":[95,-1,10,0],"S30_OpenDuosCupZB":[95,-1,10,0],"S30_OpenTriosCupBR":[119,-1,10,0],"S30_OpenTriosCupZB":[119,-1,10,0],"S30_PerformanceEvaluation":[117,100,7,4],"S30_PlaystationCupJune":[66,74,10,6],"S30_PlaystationCupZBJune":[66,74,10,6],"S30_RankedCupBSGDuos":[95,-1,0,0],"S30_RankedCupBSGSolo":[120,-1,0,0],"S30_RankedCupBSGSquads":[118,-1,0,0],"S30_RankedCupEliteDuos":[2,-1,0,0],"S30_RankedCupEliteSolo":[121,-1,0,0],"S30_RankedCupEliteSquads":[118,-1,0,0],"S30_RankedCupPDDuos":[94,-1,0,0],"S30_RankedCupPDSolo":[115,-1,0,0],"S30_RankedCupPDSquads":[116,-1,0,0],"S30_RankedCupZBBSGDuos":[95,-1,0,0],"S30_RankedCupZBBSGSolo":[120,-1,0,0],"S30_RankedCupZBBSGSquads":[118,-1,0,0],"S30_RankedCupZBPlatinumDuos":[94,-1,0,0],"S30_RankedCupZBPlatinumSolo":[115,-1,0,0],"S30_RankedCupZBPlatinumSquads":[116,-1,0,0],"S30_ReloadZB":[122,-1,7,0],"S30_Reload":[122,-1,7,0],"S30_SoloVictoryCashCup":[120,46,7,3],"S30_SoloZBVictoryCashCup":[120,46,7,3],"S30_SquadsVictoryCashCup":[118,46,7,3],"S30_d4vd_Cup":[95,-1,10,0],"S31_DuosCashCupZB":[95,94,10,6],"S31_DuosCashCup":[95,94,10,6],"S31_FNCSCommunityCups_KunoRenzo":[94,-1,10,0],"S31_FNCSCommunityCups_Kyra":[94,-1,10,0],"S31_FNCSCommunityCups_Siren":[94,-1,10,0],"S31_FNCSCommunityCups_Sparkplug":[94,-1,10,0],"S31_FNCSCommunityCups_Stashd":[94,-1,10,0],"S31_InfluencerCup":[95,46,7,3],"S31_PerformanceEvaluation":[95,46,7,4],"S31_PlatformReloadDuosCashCupConsole":[123,122,7,6],"S31_PlatformReloadDuosCashCupMobile":[123,122,7,6],"S31_PlatformReloadDuosCashCupPC":[123,122,7,6],"S31_PlaystationSypherPKCup":[120,115,10,6],"S31_RankedCupBRBSGDuos":[95,-1,0,0],"S31_RankedCupBREliteDuos":[2,-1,0,0],"S31_RankedCupBRPDDuos":[94,-1,0,0],"S31_RankedCupBSGDuos":[95,-1,0,0],"S31_RankedCupEliteDuos":[2,-1,0,0],"S31_RankedCupPDDuos":[94,-1,0,0],"S31_RankedCupZBBSGDuos":[95,-1,0,0],"S31_RankedCupZBPlatinumDuos":[94,-1,0,0],"S31_RankedCupZB_BSGDuos":[95,-1,0,0],"S31_RankedCupZB_PlatinumDuos":[94,-1,0,0],"S31_RubiusIconCup":[124,-1,10,0],"S31_SoloVictoryCashCup":[120,46,7,3],"S31_SoloZBVictoryCashCup":[120,46,7,3],"S31_SquadsReloadCup":[123,-1,7,0],"S31_SquadsReloadVictoryCashCup":[122,46,7,3],"S31_SymbioteCup":[95,-1,10,0],"S31_TriosCashCup":[119,125,10,10],"S32_FNCSCommunityCups":[94,-1,10,0],"S32_PerformanceEvaluation":[95,46,7,4],"S32_PlatformReloadDuosCashCupConsole":[123,-1,7,0],"S32_PlatformReloadDuosCashCupMobile":[123,-1,7,0],"S32_PlatformReloadDuosCashCupPC":[123,-1,7,0],"S32_RankedCupBSGDuos":[95,-1,0,0],"S32_RankedCupBSGSolo":[120,-1,0,0],"S32_RankedCupEliteDuos":[2,-1,0,0],"S32_RankedCupEliteSolo":[121,-1,0,0],"S32_RankedCupPDDuos":[94,-1,0,0],"S32_RankedCupPDSolo":[115,-1,0,0],"S32_RankedCupZBBSGDuos":[95,-1,0,0],"S32_RankedCupZBBSGSolo":[120,-1,0,0],"S32_RankedCupZBPlatinumDuos":[94,-1,0,0],"S32_RankedCupZBPlatinumSolo":[115,-1,0,0],"S32_SoloVictoryCashCup":[120,46,7,3],"S32_SoloZBVictoryCashCup":[120,46,7,3],"S32_SquadsReloadCup":[123,-1,7,0],"S32_TriosCashCup":[119,125,10,6],"S32_TriosCashCup_ZB":[119,125,10,6],"S33_FNCSCommunityCups":[17,-1,10,0],"S33_FNCSDivisionalCup_Division1":[125,126,10,6],"S33_FNCSDivisionalCup_Division2":[119,-1,10,0],"S33_FNCSDivisonalCup_Division3":[119,-1,10,0],"S33_FNCSMajor1_Final":[8,-1,6,0],"S33_FNCSMajor1_GroupStage":[127,-1,5,0],"S33_FNCSMajor1_LastChanceQualifier":[119,128,10,3],"S33_FNCSMajor1_PlayInStage":[125,-1,10,0],"S33_FNCS_Trial":[119,-1,10,0],"S33_OGCommunityCupZB":[94,-1,10,0],"S33_OGCommunityCup":[94,-1,10,0],"S33_OGCupZB":[116,-1,10,0],"S33_OGCup":[116,-1,10,0],"S33_PerformanceEvaluation":[119,46,7,4],"S33_PlaystationCup":[17,72,10,6],"S33_RankedCupBSGDuos":[95,-1,0,0],"S33_RankedCupBSGSolo":[129,-1,0,0],"S33_RankedCupBSSolo":[129,-1,0,0],"S33_RankedCupEliteDuos":[2,-1,0,0],"S33_RankedCupEliteSolo":[130,-1,0,0],"S33_RankedCupPDDuos":[94,-1,0,0],"S33_RankedCupPDSolo":[131,-1,0,0],"S33_SoloCashCup":[17,72,10,10],"S34_ClixIconCup":[119,-1,10,0],"S34_EliteZadieCup":[0,-1,10,0],"S34_FNCSCommunityCups":[17,-1,10,0],"S34_FNCSDivisionalCup_Division1":[125,126,10,6],"S34_FNCSDivisionalCup_Division2":[119,-1,10,0],"S34_FNCSDivisionalCup_Division3":[119,-1,10,0],"S34_FNCSMajor2_Final":[8,-1,6,0],"S34_FNCSMajor2_GroupStage":[127,-1,5,0],"S34_FNCSMajor2_LastChanceQualifier":[119,128,10,3],"S34_FNCSMajor2_PlayInStage":[125,-1,10,0],"S34_LanternFestCup":[17,-1,10,0],"S34_OGCupZB":[116,-1,10,0],"S34_OGCup":[116,-1,10,0],"S34_PerformanceEvaluationReloadAll":[0,46,7,4],"S34_PerformanceEvaluationReload":[132,132,7,4],"S34_PerformanceEvaluation":[119,46,7,4],"S34_PlaystationCup":[17,72,10,6],"S34_RankedCupBSGDuos":[95,-1,0,0],"S34_RankedCupBSGSolo":[129,-1,0,0],"S34_RankedCupEliteDuos":[2,-1,0,0],"S34_RankedCupEliteSolo":[130,-1,0,0],"S34_RankedCupPDDuos":[94,-1,0,0],"S34_RankedCupPDSolo":[131,-1,0,0],"S34_ShoheiOhtaniCup":[17,-1,10,0],"S34_SoloCashCup":[17,72,10,10],"S34_ThunderboltsCup":[94,-1,10,0],"S35_FNCSCommunityCups_Bugha":[0,-1,10,0],"S35_FNCSCommunityCups_Clix":[0,-1,10,0],"S35_FNCSCommunityCups_Lachlan":[0,-1,10,0],"S35_FNCSCommunityCups_Loserfruit":[0,-1,10,0],"S35_FNSCShowdown":[125,126,10,6],"S35_OGCupZB":[116,-1,10,0],"S35_OGCup":[116,-1,10,0],"S35_PerformanceEvaluation":[119,46,7,4],"S35_RankedCupBSGDuos":[95,-1,0,0],"S35_RankedCupBSGSolo":[129,-1,0,0],"S35_RankedCupBSGTrios":[119,-1,0,0],"S35_RankedCupEliteDuos":[2,-1,0,0],"S35_RankedCupEliteSolo":[130,-1,0,0],"S35_RankedCupEliteTrios":[8,-1,0,0],"S35_RankedCupPDDuos":[94,-1,0,0],"S35_RankedCupPDSolo":[131,-1,0,0],"S35_RankedCupPDTrios":[125,-1,0,0],"S35_ReloadRankedCup_BSG_Duos":[0,-1,0,0],"S35_ReloadRankedCup_Elite_Duos":[0,-1,0,0],"S35_ReloadRankedCup_PD_Duos":[0,-1,0,0],"S35_VictoryDuosCup":[94,46,7,3],"S36_FNCSCommunityCup":[17,-1,10,0],"S36_FNCSDivisionalCup_Division1":[125,126,10,7],"S36_FNCSDivisionalCup_Division2":[119,-1,10,0],"S36_FNCSDivisionalCup_Division3":[119,-1,10,0],"S36_FNCSMajor3_Final":[8,-1,6,0],"S36_FNCSMajor3_GroupStage":[127,-1,5,0],"S36_FNCSMajor3_LastChanceQualifier":[119,128,10,3],"S36_FNCSMajor3_PlayInStage":[125,-1,10,0],"S36_FantasticFourCups":[118,-1,10,0],"S36_OGCups_BR":[116,-1,10,0],"S36_OGCups_ZB":[116,-1,10,0],"S36_PerformanceEvaluation":[119,46,7,4],"S36_PlayStationCup":[17,72,10,6],"S36_RangerCup_Pink":[17,-1,10,0],"S36_RangerCup_Red":[17,-1,10,0],"S36_SquidGroundVictoryDuosCup":[94,46,7,3],"S36_SquidGroundsCups":[0,-1,10,0],"S36_VictoryDuosCup":[94,46,7,3],"S37_AceWildCardCup":[0,0,3,3],"S37_AceWildCardCup_Group2":[0,0,0,3],"S37_AceWildCardCup_Group3":[0,0,0,3],"S37_AxeOfChampionsCup":[17,-1,10,0],"S37_AxeOfChampsBlitzMobileCup":[0,-1,10,0],"S37_BladeOfChampsCupGroup2":[0,0,0,3],"S37_BladeOfChampsCupGroup3":[0,0,0,3],"S37_BladeOfChampsCup":[0,0,3,3],"S37_BlitzCupOneSwing":[0,-1,10,0],"S37_BlitzCupsAllPlatforms":[0,-1,10,0],"S37_BlitzCups":[0,-1,10,0],"S37_BlitzMobileCupWeekly":[0,-1,10,0],"S37_BlitzMobileCup":[0,-1,10,0],"S37_ChampionCrystalCup":[17,-1,10,0],"S37_ChampionPJCup":[17,-1,10,0],"S37_ConsoleDuosCashCups":[94,46,7,3],"S37_DuosDivisionalCupTrial":[95,-1,10,0],"S37_DuosDivisionalCup_Division1":[133,2,10,6],"S37_DuosDivisionalCup_Division2":[95,-1,10,0],"S37_DuosDivisionalCup_Division3":[95,-1,10,0],"S37_DuosDivisionalCup_Division4":[95,-1,10,0],"S37_DuosDivisionalCup_Division5":[117,-1,10,0],"S37_EarlyAccessCup":[0,0,10,10],"S37_EliteZadieCup":[0,0,3,3],"S37_EliteZadieCup_Group2":[0,0,0,3],"S37_EliteZadieCup_Group3":[0,0,0,3],"S37_FNCSCommunityCups_Bugha":[0,-1,10,0],"S37_FNCSCommunityCups_Clix":[0,-1,10,0],"S37_FNCSCommunityCups_Lachlan":[0,-1,10,0],"S37_FNCSCommunityCups_Loserfruit":[0,-1,10,0],"S37_FNCSDivisionalCup_Division1":[125,126,10,7],"S37_FNCSDivisionalCup_Division2":[119,-1,10,0],"S37_FNCSDivisionalCup_Division3":[119,-1,10,0],"S37_HauntedCupJason":[0,-1,10,0],"S37_HauntedCupWednesday":[0,-1,10,0],"S37_KaiCenatIconCup":[0,-1,15,0],"S37_MrSavageIconCup":[95,-1,10,0],"S37_OGCups_BR":[116,-1,10,0],"S37_OGCups_ZB":[116,-1,10,0],"S37_PerformanceEvaluationDuos":[95,46,7,4],"S37_PerformanceEvaluation":[119,46,7,4],"S37_PlayStationCup":[17,72,10,6],"S37_ReloadQuickCup":[0,0,3,3],"S37_ReloadQuickCup_Group2":[0,0,0,3],"S37_ReloadQuickCup_Group3":[0,0,0,3],"S37_SoloSeriesCup":[17,72,10,6],"S37_SurfWitchBlitzMobileCup":[0,-1,10,0],"S37_SurfWitchCup":[17,-1,10,0],"S38_BlitzMobileCup":[134,135,10,10],"S38_DuosVictoryCup":[94,46,7,3],"S38_OGCup_BR":[94,-1,10,0],"S38_OGCup":[94,-1,10,0],"S38_OGCup_ZB":[94,-1,10,0],"S38_PerformanceEvaluation":[95,46,7,4],"S38_PlayStationCupReload":[0,0,5,5],"S38_ReloadQuickCup":[0,0,3,3],"S38_ReloadQuickCup_Group2":[0,0,0,3],"S38_ReloadQuickCup_Group3":[0,0,0,3],"S38_SoloSeriesCup":[17,46,10,3],"S38_SquadsVictoryCup":[136,46,7,3],"S38_StrangerThingsCup":[0,-1,15,0],"S38_StrangerThingsMobileCup":[0,-1,15,0],"S38_TouchOnlyMobileCup":[134,134,10,10],"S39_1MillionUnrealCup":[95,-1,10,0],"S39_BleachCup":[17,-1,10,0],"S39_DuosConsoleVictoryCupZB_Jan":[94,46,7,3],"S39_DuosVictoryCup":[95,46,7,3],"S39_FNCSDivisionalCupTrial":[95,-1,11,0],"S39_FNCSDivisionalCup_Division1":[133,2,11,6],"S39_FNCSDivisionalCup_Division2":[95,-1,11,0],"S39_FNCSDivisionalCup_Division3":[95,-1,11,0],"S39_FNCSDivisionalCup_Division4":[95,-1,11,0],"S39_FNCSDivisionalCup_Division5":[117,-1,11,0],"S39_KPDHCup":[17,-1,10,0],"S39_KizunaAICupMobile":[137,-1,10,0],"S39_KizunaAICup":[95,-1,10,0],"S39_LanternFestCupMobile":[137,-1,10,0],"S39_LanternFestCup":[138,-1,12,0],"S39_MobileSeriesCupFebQual":[135,-1,10,0],"S39_MobileSeriesCupJanQual":[135,-1,10,0],"S39_MobileSeriesCupMarQual":[135,-1,10,0],"S39_MobileSeriesFeb":[137,137,10,10],"S39_MobileSeriesJan":[137,137,10,10],"S39_MobileSeriesMar":[137,137,10,10],"S39_NvidiaCup":[17,-1,10,0],"S39_PerformanceEvaluation":[95,46,7,4],"S39_PickleRickCup":[17,-1,10,0],"S39_PlayStationCupZB":[17,72,10,6],"S39_PlayStationCup":[17,72,10,6],"S39_ReloadCashVictoryCup_Dec":[138,46,10,3],"S39_ReloadCashVictoryCup_Jan":[138,46,10,3],"S39_ReloadEliteSeries1Final":[139,-1,8,0],"S39_ReloadEliteSeries1Heat1":[139,-1,8,0],"S39_ReloadEliteSeries1Heat2":[139,-1,8,0],"S39_ReloadEliteSeries1Heat3":[139,-1,8,0],"S39_ReloadEliteSeries1Heat4":[139,-1,8,0],"S39_ReloadEliteSeries1Opens":[138,-1,12,0],"S39_ReloadEliteSeries1PlayIn":[138,-1,12,0],"S39_ReloadEliteSeries2Final":[140,-1,8,0],"S39_ReloadEliteSeries2Heat1":[140,-1,8,0],"S39_ReloadEliteSeries2Heat2":[140,-1,8,0],"S39_ReloadEliteSeries2Heat3":[140,-1,8,0],"S39_ReloadEliteSeries2Heat4":[140,-1,8,0],"S39_ReloadEliteSeries2Opens":[141,-1,12,0],"S39_ReloadEliteSeries2PlayIn":[141,-1,12,0],"S39_SoloLevelingCup":[17,-1,10,0],"S39_SoloLevelingMobileCup":[137,-1,10,0],"S39_SoloSeriesCupFinal":[72,-1,6,0],"S39_SoloSeriesCupHeats":[142,-1,6,0],"S39_SoloSeriesCup":[17,-1,10,0],"S39_SoloVictoryCup":[17,46,7,3],"S40_BakMobileCup":[143,-1,10,0],"S40_CashCup_TriosZB":[125,126,11,6],"S40_ChampionKorFNCSCupMobile":[143,-1,10,0],"S40_ChampionKorFNCSCup":[94,-1,11,0],"S40_ConsoleCC_TriosZB":[125,126,11,6],"S40_ConsoleVCC_SolosZB":[144,46,8,3],"S40_DuckythegamerCupMobile":[143,-1,10,0],"S40_DuosReloadVictoryCup":[141,46,10,3],"S40_FNCSDivisionalCup_Division1":[133,2,11,6],"S40_FNCSDivisionalCup_Division2":[95,-1,11,0],"S40_FNCSDivisionalCup_Division3":[95,-1,11,0],"S40_FNCSDivisionalCup_Division4":[95,-1,11,0],"S40_FNCSDivisionalCup_Division5":[117,-1,11,0],"S40_FNCSMajor1_Final":[2,-1,6,0],"S40_FNCSMajor1_HeatsStage":[145,-1,5,0],"S40_FNCSMajor1_LastChanceQualifier":[95,146,11,5],"S40_FNCSMajor1_PlayInStage":[94,-1,11,0],"S40_FNCSMajor1_SecondChance":[94,2,11,6],"S40_MandalorianCup":[94,-1,11,0],"S40_MandalorianCup_ZB":[94,-1,11,0],"S40_MandalorianMobileCup":[143,-1,10,0],"S40_MobileSeriesApr":[143,143,10,10],"S40_MobileSeriesCupQual":[147,-1,10,0],"S40_MobileSeriesMar":[143,-1,10,0],"S40_MobileSeriesMay":[143,143,10,10],"S40_PerformanceEvaluationReload":[141,46,10,4],"S40_PerformanceEvaluation":[95,46,8,4],"S40_PlayStationCupClixZB":[17,-1,11,0],"S40_PlayStationCupClix":[17,46,11,6],"S40_PlayStationCupMrSavageZB":[17,-1,11,0],"S40_PlayStationCupMrSavage_Final":[46,-1,6,0],"S40_PlayStationCupMrSavage_Qualifier":[17,-1,11,0],"S40_ReloadEliteSeries3Final":[140,-1,8,0],"S40_ReloadEliteSeries3Heat1":[140,-1,8,0],"S40_ReloadEliteSeries3Heat2":[140,-1,8,0],"S40_ReloadEliteSeries3Heat3":[140,-1,8,0],"S40_ReloadEliteSeries3Heat4":[140,-1,8,0],"S40_ReloadEliteSeries3Opens":[141,-1,12,0],"S40_ReloadEliteSeries3PlayIn":[141,-1,12,0],"S40_ShowdownSeries_BuffPerryCup":[17,-1,11,0],"S40_ShowdownSeries_BuzzLightyearCup":[94,-1,11,0],"S40_ShowdownSeries_DaffyCup":[141,-1,12,0],"S40_ShowdownSeries_DrDoofenshmirtzCup":[17,-1,11,0],"S40_ShowdownSeries_EmperorZurgCup":[94,-1,11,0],"S40_ShowdownSeries_JonSnow":[17,-1,11,0],"S40_ShowdownSeries_LolaBunnyCup":[141,-1,12,0],"S40_ShowdownSeries_NightKing":[17,-1,11,0],"S40_SoloVictoryCup":[17,46,8,3],"S40_SpidergamerCupMobile":[143,-1,10,0],"S40_TheDonatoMobileCup":[143,-1,10,0],"S40_TripleThreatCup":[125,-1,11,0],"S40_TripleThreatMobileCup":[143,-1,10,0],"S40_TypicalGamerCup":[17,-1,11,0],"S41_CashCup_DuosZB":[94,133,11,6],"S41_ConsoleCC_DuosZB":[94,133,11,6],"S41_ConsoleVCC_SolosZB":[144,46,8,3],"S41_DavidBeckham":[125,-1,11,0],"S41_DavidBeckham_ZB":[125,-1,11,0],"S41_FNCSCommunityCup":[148,-1,11,0],"S41_FNCSCommunityCup_Mobile":[143,-1,8,0],"S41_FNCSCommunityCup_ZB":[148,-1,11,0],"S41_FNCSDivisionalCup_Division1":[94,2,11,6],"S41_FNCSDivisionalCup_Division2":[95,-1,11,0],"S41_FNCSDivisionalCup_Division3":[95,-1,11,0],"S41_FNCSDivisionalCup_Division4":[95,-1,11,0],"S41_FNCSDivisionalCup_Division5":[117,-1,11,0],"S41_FNCSLastChanceMajor":[95,95,11,11],"S41_FNCSMajor2_Final":[2,-1,6,0],"S41_FNCSMajor2_HeatsStage":[145,-1,5,0],"S41_FNCSMajor2_LastChanceQualifier":[95,146,11,5],"S41_FNCSMajor2_PlayInStage":[94,-1,11,0],"S41_MobileSeriesCupQual":[147,-1,6,0],"S41_MobileSeriesHeat1":[147,-1,6,0],"S41_MobileSeriesHeat2":[147,-1,6,0],"S41_MobileSeriesHeat3":[147,-1,6,0],"S41_MobileSeriesHeat4":[147,-1,6,0],"S41_MobileSeriesOpen":[143,143,8,8],"S41_MobileVictoryCup_BR":[17,46,6,3],"S41_MobileVictoryCup_RES":[149,46,6,3],"S41_MobileVictoryCup_ReloadminiV":[137,46,8,6],"S41_MobileVictoryCup_ZBReload":[149,46,6,3],"S41_MobileVictoryCup_ZB":[17,46,6,3],"S41_MongraalIconCup":[150,-1,12,0],"S41_PSCupDaysOfPlay":[17,72,11,6],"S41_PSCupDaysOfPlay_ZB":[17,72,11,6],"S41_PSTypicalGamer":[17,46,11,6],"S41_PSTypicalGamer_ZB":[17,46,11,6],"S41_PerformanceEvaluationReload":[141,46,10,4],"S41_PerformanceEvaluation":[95,46,8,4],"S41_ReloadEliteSeries4Final":[140,-1,8,0],"S41_ReloadEliteSeries4Heat1":[140,-1,8,0],"S41_ReloadEliteSeries4Heat2":[140,-1,8,0],"S41_ReloadEliteSeries4Heat3":[140,-1,8,0],"S41_ReloadEliteSeries4Heat4":[140,-1,8,0],"S41_ReloadEliteSeries4Opens":[141,-1,12,0],"S41_ReloadEliteSeries4PlayIn":[141,-1,12,0],"S41_ReloadReloadSoloVictoryCup":[151,46,10,3],"S41_SoloVictoryCup":[17,46,8,3],"S41_SupergirlCup":[148,-1,11,0],"S41_SupergirlCup_ZB":[148,-1,11,0],"S41_SupergirlMobileCup":[152,-1,8,0],"S41_TheOdysseyCup":[17,-1,11,0],"S41_TheOdysseyCup_Mobile":[152,-1,8,0],"S41_TheOdysseyCup_ZB":[17,-1,11,0],"S41_ViniJr":[125,-1,11,0],"S41_ViniJr_Mobile":[143,-1,8,0],"S41_ViniJr_ZB":[125,-1,11,0],"S42_ArenaPerfEval":[153,-1,10,0],"S42_ChampionFocusFNCSCup":[17,-1,11,0],"S42_ChampionFocusFNCSCup_ZB":[17,-1,11,0],"S42_ChampionFocusFNCSMobileCup":[152,-1,8,0],"S42_ConsoleVCC_SolosZB":[17,46,8,3],"S42_CrashBandicootCup":[141,-1,12,0],"S42_CrashBandicootCup_ZB":[141,-1,12,0],"S42_CrashBandicootMobileCup":[155,-1,8,0],"S42_CyperpranksCup":[125,-1,11,0],"S42_CyperpranksCup_Mobile":[152,-1,8,0],"S42_CyperpranksCup_ZB":[125,-1,11,0],"S42_FNCSDivisionalCup_Division1":[94,2,11,6],"S42_FNCSDivisionalCup_Division2":[95,-1,11,0],"S42_FNCSDivisionalCup_Division3":[95,-1,11,0],"S42_FNCSDivisionalCup_Division4":[95,-1,11,0],"S42_FNCSDivisionalCup_Division5":[117,-1,11,0],"S42_FNCSSoloFastTracks":[18,-1,4,0],"S42_FNCSSoloQualifiers":[17,17,11,11],"S42_FNCSSolo_Final":[18,-1,6,0],"S42_FNCSSolo_HeatsStage":[72,-1,6,0],"S42_FNCSSolo_LastChanceQualifier":[17,72,11,5],"S42_IronmouseIconCup":[141,-1,12,0],"S42_IronmouseIconCup_ZB":[141,-1,12,0],"S42_KingdomHeartsCup":[17,-1,11,0],"S42_KingdomHeartsCup_Mobile":[152,-1,8,0],"S42_KingdomHeartsCup_ZB":[17,-1,11,0],"S42_MadisonBeerIconCup":[141,-1,12,0],"S42_MadisonBeerIconCup_Mobile":[152,-1,8,0],"S42_MadisonBeerIconCup_ZB":[141,-1,12,0],"S42_MegaManCup":[94,-1,11,0],"S42_MegaManCup_Mobile":[152,-1,8,0],"S42_MegaManCup_ZB":[94,-1,11,0],"S42_MobileSeriesCupSemiFinal":[147,-1,6,0],"S42_MobileSeriesGroup1":[147,-1,6,0],"S42_MobileSeriesGroup2":[147,-1,6,0],"S42_MobileSeriesLCQ":[143,143,8,8],"S42_MobileVictoryCup_ReloadminiV":[137,46,8,6],"S42_PSNickEh30":[17,72,11,6],"S42_PSNickEh30_ZB":[17,72,11,6],"S42_PerformanceEvaluation":[95,46,8,4],"S42_Persona5Cup":[151,-1,12,0],"S42_Persona5Cup_Mobile":[152,-1,8,0],"S42_Persona5Cup_ZB":[151,-1,12,0],"S42_ReloadCashCup_DuosZB":[141,140,12,6],"S42_ReloadDuosVictoryCup":[141,46,10,3],"S42_ReloadReloadSoloVictoryCup":[151,46,10,3],"S42_ShadowCup":[17,-1,11,0],"S42_ShadowCup_Mobile":[152,-1,8,0],"S42_ShadowCup_ZB":[17,-1,11,0],"S42_SoloVictoryCup":[17,46,8,3],"S42_TheHectorino_Mobile":[152,-1,8,0],"S42_WeezyIconCup":[17,-1,11,0],"S42_WeezyIconCup_ZB":[17,-1,11,0],"ScallywagCup":[9,-1,10,0],"ShareTheLove_Champion_Duo":[1,-1,15,0],"ShareTheLove_Champion_Solo":[1,-1,15,0],"ShareTheLove_Contender_Duo":[1,-1,15,0],"ShareTheLove_Contender_Solo":[1,-1,15,0],"ShareTheLove_Open_Duo":[1,-1,20,0],"ShareTheLove_Open_Solo":[1,-1,20,0],"ShareTheLove_Placement_Duo":[1,-1,20,0],"ShareTheLove_Placement_Solo":[1,-1,20,0],"ShareTheLove_Prospect_Duo":[1,-1,20,0],"ShareTheLove_Prospect_Solo":[1,-1,20,0],"SourDropper_LoveAndWar":[156,-1,10,0],"SourDropper_WeekendTournament_Day1":[156,-1,15,0],"SourDropper_WeekendTournament_Day2":[156,-1,15,0],"TriosOneDayCup1EU":[1,-1,15,0],"WorldCupWarmup":[10,-1,10,0],"XboxCup_Solo1":[4,-1,10,0],"s20_FridayNightZeroBuild":[157,-1,7,0],"s20_LCArchitectSolos":[83,-1,7,0],"s20_TriosHypeCup_Open":[52,-1,10,0]};
/* CUP SCORING end */
/* ОЧКИ КАПА — КАК У EPIC (его слово 29.09: «поинт система должна быть у каждого капа такая
   же, как и у настоящего фортнайт… в каждом году каждый турнир разные»). Правила — ScoringRules
   окон события Epic (tools/build-cup-scoring.js → CC_SCORE_R / CC_CUP_SCORE): места — пороги
   «топ N» с MatchRule lte, каждый пройденный порог добавляет свои очки; элимы — очки за каждый
   (или пороги gte). Раунд 2 — своё правило, если оно у события было. Семейство ищется по id
   капа так же, как раунды (ccCupRounds); кубок дивизиона — по сезону дня и номеру дивизиона.
   Нет правила — null, и вечер считает, как считал. */
// Свои id капов, записанные не так, как у Epic: Victory Cup 2024 у Epic — VictoryCashCup,
// Reload-кап 2026 — ReloadReload…, Squid Grounds 2025 (дуо) — SquidGroundVictoryDuosCup.
// World Cup Warmup 2019 (кап из lans.json, id ONL_) — своё правило Epic WorldCupWarmup: 10 матчей, VR 10, топ-5 7, топ-10 5, топ-15 3, элим 1.
const CC_CUP_FAM_ALIAS={'S36_SquidGroundsCashCup':'S36_SquidGroundVictoryDuosCup', 'ONL_Fortnite_World_Cup_2019_Warmup':'WorldCupWarmup'};
function ccCupFamily(id){
  if(!id || typeof CC_CUP_SCORE==='undefined') return null;
  const tries=[CC_CUP_FAM_ALIAS[id], id, id.replace(/VictoryCup$/, 'VictoryCashCup'), id.replace(/_Reload/, '_ReloadReload')];
  for(const t of tries){
    if(!t) continue;
    if(CC_CUP_SCORE[t]) return t;
    const k=Object.keys(CC_CUP_SCORE).find(f=>f.indexOf(t+'_')===0); if(k) return k;
  }
  return null;
}
function ccScorePlaceFn(rule){
  const tiers=rule[0]||[];
  return function(place){
    if(!(place>0)) return 0;
    let p=0; for(let i=0;i<tiers.length;i++) if(place<=tiers[i][0]) p+=tiers[i][1];
    return p;
  };
}
// Очки за элим числом: пороги gte сводятся к среднему за первые десять (у Epic они почти всегда
// ровные «+1 за каждый», и тогда это просто 1).
function ccScoreKill(rule){
  const e=rule[1];
  if(typeof e==='number') return e;
  if(!Array.isArray(e) || !e.length) return 0;
  let s=0; for(let k=1;k<=10;k++) e.forEach(t=>{ if(t[0]===k) s+=t[1]; });
  return s/10;
}
function ccCupScoreOf(famKey, round){
  const row=famKey && typeof CC_CUP_SCORE!=='undefined' ? CC_CUP_SCORE[famKey] : null;
  if(!row) return null;
  const ix=(round===2 && row[1]>=0) ? row[1] : row[0];
  if(round===2 && row[1]<0) return null;
  const rule=CC_SCORE_R[ix]; if(!rule) return null;
  return {pts:ccScorePlaceFn(rule), kill:ccScoreKill(rule), cap:round===2 ? row[3] : row[2], fam:famKey};
}
function ccCupScore(ev, round){ return ev ? ccCupScoreOf(ccCupFamily(String(ev.id||'')), round||1) : null; }
// Кубок дивизиона: семейство сезона дня — FNCSDivisionalCup_DivisionN (2025–26) или
// DivisionalCups_* (2022–23); у Epic очки у дивизионов одинаковые, берётся свой, иначе первый.
/* Очки финалов и отборов прошлых лет — по правилам Epic своего события (его правка 29.09:
   «птс система не та, на ворлд капе точно»; было — таблица FNCS 2024 для всех лет).
   World Cup 2019: неделя Online Open (Epic OnlineOpen_WeekN) и финал в Нью-Йорке
   (ONSITE_WorldCup_Solos/Duos). FNCS прошлых лет — семейство сезона дня: финал → *Final*,
   остальное → неделя/квалификация/полуфинал. Нет правила — null (остаётся прежняя таблица). */
function ccPastMajorScore(ev){
  if(!ev || typeof CC_CUP_SCORE==='undefined') return null;
  const id=String(ev.id||'');
  const wc=/^Major([12])_2019_(?:W(\d+)|Final)/.exec(id);
  if(wc) return ccCupScoreOf(wc[2] ? 'OnlineOpen_Week'+wc[2] : (wc[1]==='1' ? 'ONSITE_WorldCup_Solos' : 'ONSITE_WorldCup_Duos'), 1);
  const n=ccSeasonNumOn(ev.day||careerToday()); if(!n) return null;
  // Побочные события сезона (Surge Week — свои очки за «сёрдж», Community Cup, Warmup) — мимо.
  const fams=Object.keys(CC_CUP_SCORE).filter(k=>k.indexOf('S'+n+'_FNCS')===0 && !/Surge|Community|Warmup|Invitational/i.test(k)).sort();
  if(!fams.length) return null;
  const fin=ev.stage==='final' || /Final|_GF|Grand/i.test(id);
  /* Полуфинал — своим правилом Epic (S15–S17 SemiFinals, S18 SemiFinals_Day1, S19–S21 SemiFinals):
     раньше брался первый по алфавиту квалификатор (аудит 29.09). Правило «только победа»
     (Reboot Round, S18 Day2: 10 за победу, 0 за элим) — CC_WIN_ONLY: место в таблице решают победы. */
  if(ev.stage==='reboot') return CC_WIN_ONLY;
  if(ev.stage==='semi'){
    const semi=fams.find(k=>new RegExp('SemiFinals_Day'+(ev.r||1)+'$').test(k)) || fams.find(k=>/SemiFinals$/.test(k));
    const rule=semi && CC_CUP_SCORE[semi] && CC_SCORE_R[CC_CUP_SCORE[semi][0]];
    const winOnly=rule && rule[0].length===1 && !rule[1];
    if(winOnly) return CC_WIN_ONLY;
    if(semi) return ccCupScoreOf(semi, 1);
  }
  const pick=fin ? fams.find(k=>/Final/i.test(k) && !/Semi/i.test(k))
                 : fams.find(k=>/Week|Qualifier|Heat|SemiFinal|Semi/i.test(k) && !/Grand/i.test(k));
  return ccCupScoreOf(pick || fams[0], 1);
}
function ccDivCupScore(day, div){
  if(typeof CC_CUP_SCORE==='undefined') return null;
  const n=ccSeasonNumOn(day||careerToday()); if(!n) return null;
  const fams=Object.keys(CC_CUP_SCORE).filter(k=>new RegExp('^S'+n+'_(FNCS)?Divis[io]*nalCups?(_|$)').test(k) && !/Trial|Finals/.test(k));
  if(!fams.length) return null;
  // 2022–23 (S22–S23) дивизионы у Epic по именам: 1 — Elite, 2 — Challenger, 3 — Contender
  // (у Contender и элим дешевле всех — 1). Раньше искалось «DivisionN» и всё падало в Challenger.
  const byName={1:'Elite', 2:'Challenger', 3:'Contender'}[div];
  const own=fams.find(k=>new RegExp('Division'+div+'$').test(k)) || (byName && fams.find(k=>new RegExp('_'+byName+'$').test(k)));
  return ccCupScoreOf(own || fams.sort()[0], 1);
}
/* EVENT COLORS begin — tools/build-event-colors.js */
const CC_EV_PAL=[["4C00A9","FFFFFF","08E164","FFFFFF"],["A6FFCB","3272FF","4420CC","FFF736"],["1AF3FB","9C46FD","6E00D4","31F3FF"],["B537FB","41108C","5000BE","0BFFAC"],["D8D7E3","9D9FAD","114FF5","FFFFFF"],["00B7A4","006D6E","25FFF4","FFEA00"],["025768","00B89C","",""],["0127A6","2F7FF1","08E164","FFFFFF"],["0127A6","2F7FF1","",""],["7E00FF","F33C17","FFFFFF","FFFFFF"],["B537FB","41108C","5000BE","FFFFFF"],["EAF943","FE20CC","FFFFFF","6B0356"],["FD2ED8","17D6FF","FFFFFF","010D2F"],["000000","151414","FFFFFF","FFFFFF"],["0126B7","000410","","0EFFA7"],["A6FFCB","3272FF","4420CC","FFFFFF"],["201E1D","070707","FFFFFF","FFFFFF"],["124AEC","124AEC","F7FF00","FFFFFF"],["3A1598","9933FF","FFFFFF","0EFFA7"],["004BAA","004BAA","F7FF00","FFFFFF"],["006BD5","00D2FF","","FFFFFF"],["17D6FF","FD2ED8","FFFFFF","010D2F"],["004BAA","00E8FA","4FFF6C","FFFFFF"],["DA0528","FF6725","F7FF00","FFFFFF"],["FE20CC","EAF943","FFF608","6B0356"],["780162","EC0A52","","FFFFFF"],["171615","000000","","FFFFFF"],["3A1598","9933FF","","0EFFA7"],["09CCF8","8DFBA5","F7FF00","FFFFFF"],["FF4286","FFA349","F7FF00","FFFFFF"],["124AEC","00F0FF","F7FF00","FFFFFF"],["F50249","FF4B0A","FFED27","FFFFFF"],["0971B8","30E3FF","F7FF00","FFFFFF"],["0495E9","00529E","F7FF00","FFFFFF"],["0126B7","000410","6DFDFF","0EFFA7"],["3A1598","9933FF","","FFFFFF"],["EB1939","731428","F7FF00","FFFFFF"],["EF172C","000000","F7FF00","FFFFFF"],["FE20CC","EAF943","FFF608","FFFFFF"],["17D6FF","FD2ED8","FFF608","FFFFFF"],["06035C","FF0BA6","FF03A3","FFFFFF"],["3A1598","9933FF","06E4FF","FFFFFF"],["590191","38025A","F7FF00","FFFFFF"],["0056CC","51E5FF","F7FF00","FFFFFF"],["E82D3C","FCC711","6DFDFF","FFFFFF"],["0078FF","020C14","F7FF00","FFFFFF"],["E92622","F4A11E","FFE9AF","FFFFFF"],["FF0000","870011","FF0020","FFFFFF"],["00FCFF","071989","00FF72","FFFFFF"],["4FACFE","00F2FE","F7FF00","FFFFFF"],["D7144F","3F0B38","F6F45F","010D2F"],["0126B7","000410","6DFDFF","FFFFFF"],["249B15","D1FC5B","F7FF00","FFFFFF"],["3A0004","FF0012","FFFFFF","010D2F"],["E2236D","FF9804","F7FF00","FFFFFF"],["0076C3","012162","F7FF00","FFFFFF"],["E51717","FF730A","F7FF00","FFFFFF"],["FFA312","FB33F2","F7FF00","FFFFFF"],["091147","0472D0","FF6D01","FFFFFF"],["17D6FF","FD2ED8","FFF608","010D2F"],["1B0347","5118D2","F7FF00","FFFFFF"],["00B7FB","4AD53E","FFF608","FFFFFF"],["A7108B","F13C42","FFE92B","FFFFFF"],["320C55","9A1DB8","74D82B","FFFFFF"],["15161C","313139","58FE85","FFFFFF"],["F50249","FF4B0A","F7FF00","FFFFFF"],["0CA104","67E10D","F7FF00","FFFFFF"],["39B701","50E805","F7FF00","FFFFFF"],["36027C","130026","F7FF00","FFFFFF"],["230049","7000E7","F334FF","FFFFFF"],["5300AB","5000A5","D7FF00","FFFFFF"],["05002D","526FBC","FEEF02","FFFFFF"],["3A1598","9933FF","6DFDFF","FFFFFF"],["200347","7818D2","F7FF00","FFFFFF"],["1F0141","7818D2","F7FF00","FFFFFF"],["101C46","003B8A","F7FF00","FFFFFF"],["7818D2","200347","F7FF00","FFFFFF"],["FF3D00","FB7635","F7FF00","FFFFFF"],["C3C5D7","EEEDFB","F7FF00","FFFFFF"],["D8D7E3","AAACBB","F7FF00","FFFFFF"],["0126B7","000410","F7FF00","FFFFFF"],["E2E1B6","B0A570","F7FF00","FFFFFF"],["04CBD7","65E86B","F7FF00","FFFFFF"],["02004B","009AEA","F7FF00","FFFFFF"],["E61107","FFD909","F7FF00","FFFFFF"],["00FE6A","0068FD","F7FF00","FFFFFF"],["00C3B8","FD37FF","F7FF00","FFFFFF"],["5801B3","7802F3","F7FF00","FFFFFF"],["E82CBE","680652","F7FF00","FFFFFF"],["9D35FF","3C0999","F7FF00","FFFFFF"],["AAACBB","AAACBB","F7FF00","FFFFFF"],["FF5900","C04400","F7FF00","FFFFFF"],["6532F6","A2169C","F7FF00","FFFFFF"],["00265F","0054D3","F7FF00","FFFFFF"],["BC1A84","0085D9","F7FF00","FFFFFF"],["870FF9","2E0578","F7FF00","FFFFFF"],["00A9D3","001179","F7FF00","FFFFFF"],["0434E3","029DD7","F7FF00","FFFFFF"],["05D6E9","071898","F7FF00","FFFFFF"],["7F0B1B","C31829","F7FF00","FFFFFF"],["D87D4F","C12A9F","F7FF00","FFFFFF"],["BC3900","FF730C","F7FF00","FFFFFF"],["9802C9","DC0168","F7FF00","FFFFFF"],["79053E","E0006F","F7FF00","FFFFFF"],["001BBA","00D0FF","F7FF00","FFFFFF"],["650C18","C60F21","F7FF00","FFFFFF"],["2D0760","6912E0","F7FF00","FFFFFF"],["D8D7E3","9D9FAD","08E164","FFFFFF"],["2D0670","6912E0","F7FF00","FFFFFF"],["00002D","00002D","C8FF00","FFFFFF"],["00265F","00002D","C8FF00","FFFFFF"],["BC3900","FF730C","C8FF00","FFFFFF"],["171D55","0054CC","F7FF00","FFFFFF"],["441208","C77D00","F7FF00","FFFFFF"],["829FA9","FFFFFF","FF0040","FFFFFF"],["829FA9","FFFFFF","08E164","FFFFFF"],["FF5013","E9DB3B","F7FF00","FFFFFF"],["051342","096E4C","",""],["9C0013","F21630","",""],["9C0013","F31630","08E164","FFFFFF"],["421777","A71621","F7FF00","FFFFFF"],["0189C4","43D5F7","F7FF00","FFFFFF"],["001718","31D9D8","F7FF00","FFFFFF"],["050F77","0039F5","F7FF00","FFFFFF"],["00002D","33337D","C8FF00","FFFFFF"],["000000","FF283D","F7FF00","FFFFFF"],["0664F0","8912FF","F7FF00","FFFFFF"],["CB3900","FF6321","",""],["4C00A9","8321FB","",""],["829FA9","FFFFFF","","FFFFFF"],["00002D","33337D","",""],["FB33F2","FF6321","",""],["9C0013","F3233D","",""],["0C6CC9","3DB5FF","",""],["C6328F","FD73B8","",""],["A90B09","FF4946","",""],["481C2B","E82077","",""],["061414","14685F","",""],["092382","2557FF","",""],["141414","545454","",""],["0664F0","8912FF","08E164","FFFFFF"],["00629A","43D5F7","08E164","FFFFFF"],["140001","3F3953","",""],["092832","2557FF","",""],["140000","403954","",""],["460000","C40001","",""],["2B2B2B","FE7A04","",""],["092382","2557FF","F7FF00","FFFFFF"],["041827","0076C9","",""],["FFB300","FFC000","F7FF00","FFFFFF"],["FB33F2","FFA312","",""],["520003","C62B29","",""],["101216","1D2027","",""],["3A6474","6E9DAF","",""],["7D726A","CDC3BC","",""],["B38EFF","FEC5FF","",""],["152C1C","198565","",""],["252424","3C3B3C","",""],["007B14","76B900","",""],["001821","0F2F3D","",""],["050F77","0039F5","",""],["2D2D2D","14161C","",""],["F5941D","F9E92A","",""],["04101D","1E3472","",""],["300083","F055D5","",""],["5A000B","FE0120","",""],["0664F0","8912FF","",""],["003A47","00B89C","",""],["0E3E7C","16519D","",""],["37561F","5B9214","",""],["010A82","0137ED","",""],["DF9A0E","EDD27B","",""],["08225F","69CBF0","",""],["30003E","BE00FF","",""],["1150B7","00D6F8","",""],["131415","2F3437","",""],["1D1D1D","4A4A4A","",""],["0E0C3D","19166F","",""],["390E70","921EE5","",""],["15476B","0FD0AB","",""],["803923","ED7E2B","",""],["473C7C","22182D","",""],["041468","2550F6","",""],["240580","7910B6","",""],["521963","AD59A2","",""],["0B0321","180B56","",""],["0E3F5C","3E7292","",""],["06010D","1A0D5E","",""],["3D1182","835AD9","",""],["000000","B80101","",""],["352A30","FD1577","FF46AB","FF46AB"],["0075FF","FB0172","","FFFFFF"],["8B008D","3C096B","","7E058F"],["8B008D","3C096B","FFFFFF","7E058F"],["39FF6F","9718E8","39FF6F","FFFFFF"],["E33404","E2C002","F7FF00","FFFFFF"]];
const CC_EV_COL={"Acrocanthosaurus_Official":0,"ArchitectPopUpDuoEU":1,"ArchitectPopUpSoloEU":2,"ArchitectPopUpSquadEU":3,"BambiRaptor":4,"BlackheartCup":5,"Bratwurst_Official":6,"CashCup_Trios1":1,"CashCup_Trios2":1,"Dinosauron_Official":7,"LuxeCup":5,"MannekenPis_Official":8,"ONSITE_WorldCup_Duos":9,"ONSITE_WorldCup_ProAm":10,"ONSITE_WorldCup_Solos":9,"ONSITE_Worldcup_Creative":9,"OnlineOpen_Week10":9,"OnlineOpen_Week1":9,"OnlineOpen_Week2":9,"OnlineOpen_Week3":9,"OnlineOpen_Week4":9,"OnlineOpen_Week5":9,"OnlineOpen_Week6":9,"OnlineOpen_Week7":9,"OnlineOpen_Week8":9,"OnlineOpen_Week9":9,"S10_CC_Champions":11,"S10_CC_Contenders":12,"S10_CC_Trios":11,"S10_FNCS_Finals":13,"S10_FNCS_Finals_Runback":13,"S10_FNCS_Week1":13,"S10_FNCS_Week2":13,"S10_FNCS_Week3":13,"S10_FNCS_Week4":13,"S10_FNCS_Week5":13,"S11_CC_Contenders":12,"S11_CelebrationCup":14,"S11_DreamhackWinter_BYOC":15,"S11_FNCS_Finals":16,"S11_FNCS_Warmup":16,"S11_FNCS_Week1":16,"S11_FNCS_Week2":16,"S11_FNCS_Week3":16,"S11_FNCS_Week4":16,"S11_FNF":17,"S11_HypeNight":18,"S11_HypeNight_Level1":18,"S11_PlatformCup_Console":19,"S11_PlatformCup_Mobile":19,"S11_PlatformCup_PC":11,"S11_WinterRoyale_Console":20,"S11_WinterRoyale_Mobile":20,"S11_WinterRoyale_PC":20,"S12_BenjyFishyCup_Round1":5,"S12_BenjyFishyCup_Round2":5,"S12_CCV2_Contenders_Round1":21,"S12_CCV2_Contenders_Round2":21,"S12_CCV2_Platform_Console_Round1":22,"S12_CCV2_Platform_Console_Round2":22,"S12_CCV2_Platform_Mobile_Round1":23,"S12_CCV2_Platform_Mobile_Round2":23,"S12_CCV2_Platform_PC_Round1":24,"S12_CCV2_Platform_PC_Round2":24,"S12_CC_Contenders_Ghost":21,"S12_CC_Contenders_Shadow":21,"S12_CC_Platform_Console_Ghost":22,"S12_CC_Platform_Console_Shadow":22,"S12_CC_Platform_Mobile_Ghost":23,"S12_CC_Platform_Mobile_Shadow":23,"S12_CC_Platform_PC_Ghost":24,"S12_CC_Platform_PC_Shadow":24,"S12_DailyDuos_Console":25,"S12_DailyDuos_PC":25,"S12_DoigbyCup":26,"S12_FNCS_Finals_Console":26,"S12_FNCS_Finals_PC":26,"S12_FNCS_Invitational_Open":26,"S12_FNCS_Invitational_Reboot":26,"S12_FNCS_Invitational_Week1":26,"S12_FNCS_Invitational_Week2":26,"S12_FNCS_Invitational_Week3":26,"S12_FNCS_Warmup_Console":26,"S12_FNCS_Warmup_PC":26,"S12_FNCS_Week1_Console":26,"S12_FNCS_Week1_PC":26,"S12_FNCS_Week2_Console":26,"S12_FNCS_Week2_PC":26,"S12_FNCS_Week3_Console":26,"S12_FNCS_Week3_PC":26,"S12_FNCS_Week4_Console":26,"S12_FNCS_Week4_PC":26,"S12_HypeNight_Level1_Ghost":27,"S12_HypeNight_Level1_Shadow":27,"S12_HypeNight_Level2_Ghost":27,"S12_HypeNight_Level2_Shadow":27,"S12_PiazzDuos":25,"S13_AmarTriosCup":28,"S13_AquaNyhroxThrowbackCup":9,"S13_BlueFlatline_EUNAE_Contender":26,"S13_BughaThrowbackCup":9,"S13_CC_Champions":21,"S13_CC_Contenders":21,"S13_CC_Platform_Console":22,"S13_CC_Platform_Mobile":23,"S13_CC_Platform_PC":24,"S13_DailyHypeCup":29,"S13_DailyTrios_Console":29,"S13_DailyTrios_PC":29,"S13_DoigCupTrios":30,"S13_Dreamhack_August_Finals":31,"S13_Dreamhack_August_Heat1":31,"S13_Dreamhack_August_Heat2":31,"S13_Dreamhack_August_SemiFinals":31,"S13_Dreamhack_July_Finals":31,"S13_Dreamhack_July_Heat1":31,"S13_Dreamhack_July_Heat2":31,"S13_Dreamhack_July_SemiFinals":31,"S13_BlueFlatlineBracket_Champion":26,"S13_BlueFlatline_Champion":26,"S13_FNCS_Finals_Console":32,"S13_FNCS_Finals_PC":32,"S13_FNCS_Qualifier1_Console":32,"S13_FNCS_Qualifier1_PC":32,"S13_FNCS_Qualifier2_Console":32,"S13_FNCS_Qualifier2_PC":32,"S13_FNCS_Qualifier3_Console":32,"S13_FNCS_Qualifier3_PC":32,"S13_FNCS_Qualifier4_Console":32,"S13_FNCS_Qualifier4_PC":32,"S13_FreeFortniteCup":33,"S13_GalaxyCupSolo":34,"S13_HypeNight":35,"S13_HypeNight_Plus":35,"S13_JacobSoloCup":30,"S13_LlobetiTriosCup":28,"S13_MongraalSoloCup":28,"S13_MrSavageTriosCup":28,"S13_RaiseTheCup":36,"S13_TwoPlayersOneConsole":30,"S14_BlackWidowCup":37,"S14_CC_Champions":38,"S14_CC_Contenders":39,"S14_CC_Platform_Console":22,"S14_CC_Platform_PC":22,"S14_DaredevilCup":37,"S14_Dreamhack_November_Finals":31,"S14_Dreamhack_November_Heat1":31,"S14_Dreamhack_November_Heat2":31,"S14_Dreamhack_November_SemiFinals":31,"S14_Dreamhack_October_Finals":31,"S14_Dreamhack_October_Heat1":31,"S14_Dreamhack_October_Heat2":31,"S14_Dreamhack_October_SemiFinals":31,"S14_Dreamhack_September_Finals":31,"S14_Dreamhack_September_Heat1":31,"S14_Dreamhack_September_Heat2":31,"S14_Dreamhack_September_SemiFinals":31,"S14_EUEncore":28,"S14_FNCS_Finals_Console":40,"S14_FNCS_Finals_Console_Grandfinals":40,"S14_FNCS_Finals_Console_Heat1":40,"S14_FNCS_Finals_Console_Heat2":40,"S14_FNCS_Finals_Console_Heat3":40,"S14_FNCS_Finals_Console_Heat4":40,"S14_FNCS_Finals_PC":40,"S14_FNCS_Finals_PC_Grandfinals":40,"S14_FNCS_Finals_PC_Heat1":40,"S14_FNCS_Finals_PC_Heat2":40,"S14_FNCS_Finals_PC_Heat3":40,"S14_FNCS_Finals_PC_Heat4":40,"S14_FNCS_Qualifier1_Console":40,"S14_FNCS_Qualifier1_PC":40,"S14_FNCS_Qualifier2_Console":40,"S14_FNCS_Qualifier2_PC":40,"S14_FNCS_Qualifier3_Console":40,"S14_FNCS_Qualifier3_PC":40,"S14_FNCS_Warmup_Console":40,"S14_FNCS_Warmup_PC":40,"S14_GhostRiderCup":37,"S14_HypeNite":35,"S14_LachlanPickaxeFrenzy":30,"S14_MarvelSuperCup":37,"S14_Season4HypeCup":41,"S14_VenomCup":37,"S14_WildWednesday":42,"S15_ACMilanCup":43,"S15_ASRomaCup":43,"S15_BhangraBoogieCup":44,"S15_CashCup":39,"S15_CyprusCup":45,"S15_Dreamhack_December_Finals":31,"S15_Dreamhack_December_Heat1":31,"S15_Dreamhack_December_Heat2":31,"S15_Dreamhack_December_SemiFinals":31,"S15_Dreamhack_January_Finals":31,"S15_Dreamhack_January_Heat1":31,"S15_Dreamhack_January_Heat2":31,"S15_Dreamhack_January_Heat3":31,"S15_Dreamhack_January_SemiFinals":31,"S15_FNCS_GrandFinals":46,"S15_FNCS_Qualifier1":46,"S15_FNCS_Qualifier2":46,"S15_FNCS_Qualifier3":46,"S15_FNCS_RebootRound":46,"S15_FNCS_SemiFinals":46,"S15_FazeCityCup":43,"S15_FlashCup":47,"S15_FloorIsLavaLTM":42,"S15_FridayNiteBraggingRights":48,"S15_FridayNiteBraggingRights_Console":48,"S15_FridayNiteBraggingRights_Mobile":48,"S15_FrostyFrenzy":49,"S15_GrefGSolo":30,"S15_GrefGSquads":30,"S15_HeartsWildCup":50,"S15_HypeCup":35,"S15_InterMilanCup":43,"S15_LazarAndFreshSuperKnockback":30,"S15_OneShotLTM":42,"S15_PSGenerationsCup":51,"S15_PeleCup":52,"S15_RagsToRichesLTM":42,"S15_SolidGoldLTM":42,"S15_SoloCashCup":39,"S15_SwitchCup3":53,"S15_TrinityCup":54,"S16_AloyCup":55,"S16_CashCupExtraDH":56,"S16_CashCup":39,"S16_CloseEncountersLTM":42,"S16_ConsoleChampionsCup":57,"S16_DeathstrokeCup":58,"S16_Dreamhack_April_Finals":31,"S16_Dreamhack_April_Heat1":31,"S16_Dreamhack_April_Heat2":31,"S16_Dreamhack_April_SemiFinals":31,"S16_EliteScrims":59,"S16_FNCS_Finals":60,"S16_FNCS_Qualifier1":60,"S16_FNCS_Qualifier2":60,"S16_FNCS_Qualifier3":60,"S16_FNCS_RebootRound":60,"S16_FNCS_SemiFinals":60,"S16_FloorIsLavaSoloLTM":42,"S16_FridayNiteBraggingRights_Console":48,"S16_FridayNiteBraggingRights_Mobile":48,"S16_FridayNiteBraggingRights_PC":48,"S16_HighExplosivesLTM":42,"S16_HypeCup":35,"S16_NeymarJrCup":61,"S16_OneShotLTM":42,"S16_OpenScrims":59,"S16_SoloCashCup":38,"S16_SpringBreakoutCup":62,"S16_TeenTitansCup":63,"S16_UEFA_Euro_Cup_2020":43,"S17_BlueCheese":43,"S17_BlueCheese_trial":43,"S17_CammyCup":64,"S17_CashCupExtraDH":65,"S17_CashCup":39,"S17_ConsoleChampionsCup":57,"S17_Dreamhack_August_Finals":31,"S17_Dreamhack_August_Prelim1":31,"S17_Dreamhack_August_Prelim2":31,"S17_Dreamhack_August_Prelim3":31,"S17_Dreamhack_August_SemiFinals":31,"S17_FNCS_Finals":66,"S17_FNCS_Qualifier1":66,"S17_FNCS_Qualifier2":66,"S17_FNCS_Qualifier3":66,"S17_FNCS_RebootRound":66,"S17_FNCS_SemiFinals":66,"S17_FNCS_SoloFinals":67,"S17_FNCS_SoloPlayIns":67,"S17_FloorIsLavaSoloLTM":42,"S17_GalaxyCup":68,"S17_GamoraCup":69,"S17_HypeCup":35,"S17_JBalvinCup":70,"S17_OneShotLTM":42,"S17_PickaxeFrenzyLTM":42,"S17_SoloCashCup":38,"S17_SuperKnockBackLTM":42,"S17_ThanosCup":69,"S17_WonderWomanCup":71,"S17_ZoneWarsLTM":42,"S18_BlueCheese":30,"S18_BlueCheese_Quick_Cup_Solo":30,"S18_BlueCheese_Quick_Cup_Trios":30,"S18_BlueCheese_Solo":30,"S18_CashCupExtraDH":65,"S18_CashCup":39,"S18_ConsoleChampionsCup":57,"S18_Dreamhack_October_Finals":31,"S18_Dreamhack_October_Prelim1":31,"S18_Dreamhack_October_Prelim2":31,"S18_Dreamhack_October_Prelim3":31,"S18_Dreamhack_October_SemiFinals":31,"S18_DuosHypeCup":72,"S18_FNCS_Finals":73,"S18_FNCS_Qualifier1":73,"S18_FNCS_Qualifier2":73,"S18_FNCS_SemiFinals_Day1":73,"S18_FNCS_SemiFinals_Day2":73,"S18_FloorRestoresLTM":42,"S18_GrandRoyaleCommunityCup":74,"S18_GrandRoyale_Finals":75,"S18_GrandRoyale_Load":75,"S18_GrandRoyale_Reload":75,"S18_GrandRoyale_VictoryPath":75,"S18_PlaystationCup":51,"S18_PreseasonWarmup":76,"S18_SoloCashCup":38,"S18_TriosHypeCup":72,"S19_AllValleyCup":77,"S19_ConsoleChampionsCup":57,"S19_DuosCashCup":39,"S19_DuosHypeCup_Contender":39,"S19_DuosHypeCup_Open":39,"S19_FNCSCommunityCup":78,"S19_FNCS_Finals":79,"S19_FNCS_Qualifier1":79,"S19_FNCS_Qualifier2":79,"S19_FNCS_SemiFinals":79,"S19_LCBestOf":42,"S19_LCHighScore":42,"S19_PlaystationCupMarch":80,"S19_PlaystationCup":80,"S19_SilkSonicCup":81,"S19_SoloCashCup":38,"S19_SoloHypeCup_Contender":38,"S19_SoloHypeCup_Open":38,"S19_ThriveCup":82,"S19_TriosHypeCup_Champion":72,"S19_TriosHypeCup_Contender":72,"S19_TriosHypeCup_Open":72,"S20_AliaACup":83,"S20_AndroidStreetFighterCup":84,"S20_ChicaCup":85,"S20_ChloeKimCup":86,"S20_ConsoleChampionsCup":87,"S20_DuosCashCup":88,"S20_DuosHypeCup_Contender":89,"S20_DuosHypeCup_Open":89,"S20_FNCSCommunityCup":90,"S20_FNCS_Finals":79,"S20_FNCS_Qualifier1":79,"S20_FNCS_Qualifier2":79,"S20_FNCS_Qualifier3":79,"S20_FNCS_SemiFinals":79,"S20_LCArchitectDuos":42,"S20_LCElegantWeaponsDuos":42,"S20_LCElimOnlyDuos":42,"S20_LCElimOnlyHighScoreDuos":42,"S20_LCElimOnlyHighScoreTrios":42,"S20_LCElimOnlySolo":42,"S20_LCMicroSessionsDuos":42,"S20_LCMicroSessionsTriosZBM":42,"S20_LCNoBuildDuos":42,"S20_LCNoBuildSquads":42,"S20_LCStartingLoadoutDuos":42,"S20_LCStartingLoadoutSolos":42,"S20_LCSuperBlitzDuos":42,"S20_ObiWanCup":91,"S20_PlaystationCupApril_Round1":80,"S20_PlaystationCupMay_Round1":80,"S20_PlaystationCupMay_Round2":80,"S20_PlaystationCupMay_Round3":80,"S20_SoloCashCup":88,"S20_SoloHypeCup_Contender":89,"S20_SoloHypeCup_Open":89,"S20_StreetFighterCup":84,"S20_TriosHypeCup_Champion":89,"S20_TriosHypeCup_Contender":89,"S21_ConsoleChampionsCupZBM":92,"S21_ConsoleChampionsCup":92,"S21_DreamerCup":93,"S21_DreamhackSummer":31,"S21_DreamhackSummerZBM":31,"S21_DuosCashCup":94,"S21_DuosHypeCup_Contender":95,"S21_DuosHypeCup_Open":95,"S21_FNCS_Finals":79,"S21_FNCS_Qualifier1":79,"S21_FNCS_Qualifier2":79,"S21_FNCS_Qualifier3":79,"S21_FNCS_SemiFinals":79,"S21_GalaxyCup":96,"S21_JewelRush":97,"S21_LCArchitectSolo":42,"S21_LCElimOnlyHighScoreDuos":42,"S21_LCElimOnlyHighScoreZBMSquads":42,"S21_LCHotDropDuos":42,"S21_LCNoSweatDuos":42,"S21_LCNoSweatSolo":42,"S21_LCNoSweatSquadsZBM":42,"S21_LCNoSweatTrios":42,"S21_LCQuickCupTriosZBM":42,"S21_LCQuickCup":42,"S21_LCStartingLoadoutDuos":42,"S21_LCStartingLoadoutSolo":42,"S21_LCTargetPracticeDuos":42,"S21_LCWildStormDuos":42,"S21_LGSoloCashCup":97,"S21_LGSoloQuickCup":97,"S21_LGSolosQuickCup_BR":97,"S21_LGSolosQuickCup":97,"S21_LGSolosQuickCup_ME":97,"S21_LGTriosCashCup":97,"S21_LGTriosQuickCup":97,"S21_PgodCup":98,"S21_PlaystationCupAug":93,"S21_PlaystationCupJuly":96,"S21_PlaystationCupJune":96,"S21_QuarterbackCup":99,"S21_SoloCashCupConsole":100,"S21_SoloCashCup":100,"S21_SoloHypeCup_Contender":95,"S21_SoloHypeCup_Open":95,"S21_SommersetCup":98,"S21_SuperHypeCup":95,"S21_TournamentOfPower":101,"S21_TriosCashCupZBM":88,"S21_TriosQuickCashCup":102,"S22_ConsoleChampionsCup":103,"S22_DivisionalCups_Challenger":93,"S22_DivisionalCups_Contender":93,"S22_DivisionalCups_Elite":93,"S22_DivisionalCups_Elite_Finals":93,"S22_FNCSInvitationalCommunityCup":79,"S22_Invitational":79,"S22_PlacementCup":93,"S22_PlaystationCupNov":93,"S22_PlaystationCupOct":96,"S22_PlaystationCupSep":104,"S22_PoloStadiumCup":105,"S22_QueasyCup":98,"S22_SypherPKIconCup":106,"S22_ZBMCashCup":105,"S22_ZBMQuickCup":105,"S23_CreedCup":105,"S23_DivisionalCups_Challenger":93,"S23_DivisionalCups_Contender":93,"S23_DivisionalCups_Elite":93,"S23_DivisionalCups_Elite_Finals":93,"S23_DuosFillQuickCup":93,"S23_FNCS_CommunityCup":107,"S23_FNCS_Major1_GrandFinals":107,"S23_FNCS_Major1_SurgeWeek":107,"S23_FNCS_Major1_Week1":107,"S23_FNCS_Major1_Week2":107,"S23_FNCS_Major1_Week3":107,"S23_LGSoloCashCup":106,"S23_LGSoloQuickCup":106,"S23_LGTriosCashCup":106,"S23_LGTriosQuickCup":106,"S23_Lettuce":103,"S23_PlacementCup":93,"S23_PlaystationCupFeb":93,"S23_PlaystationCupJan":93,"S23_SoloCashCup":93,"S23_SuperFlakesCup":93,"S23_ThunderCup":42,"S23_ZBMCashCup":101,"S23_ZBMQuickCupFill":101,"S23_ZBMQuickCup":101,"S23_thekidlaroi":103,"S24_ConsoleChampionsCupMay":108,"S24_ConsoleChampionsCup":108,"S24_DuosCashCup":93,"S24_DuosFillQuickCup":93,"S24_FNCS_CommunityCup":107,"S24_FNCS_Major2_GrandFinals":107,"S24_FNCS_Major2_SurgeWeek":107,"S24_FNCS_Major2_Week1":107,"S24_FNCS_Major2_Week2":107,"S24_FNCS_Major2_Week3":107,"S24_MamaBenjyFishy":93,"S24_PlaystationCupMar":93,"S24_RenegadeRunnerCupBuildZB":103,"S24_RenegadeRunnerCupBuild":103,"S24_SoloVictoryCup":93,"S24_TriosZBVictoryCashCup":101,"S24_ZBTriosFillQuickCup":101,"S25_ConsoleChampionsCup":108,"S25_DuosCashCup":93,"S25_DuosFillQuickCup":93,"S25_DuosZBVictoryCashCup":93,"S25_FNCSCommunityCup":107,"S25_FNCS_LastChanceMajor":107,"S25_FNCS_Major3_GrandFinals":107,"S25_FNCS_Major3_Week1":107,"S25_FNCS_Major3_Week2":107,"S25_FNCS_Major3_Week3":107,"S25_GalaxyCup4Android":93,"S25_GalaxyCup4":93,"S25_JJKCup":93,"S25_PerfEvaluation":93,"S25_PlaystationCupJune":93,"S25_PlaystationCupZBJune":93,"S25_SoloVictoryCashCup":93,"S25_ZBDuosFillQuickCup":93,"S26_ConsoleChampionsCupZB":108,"S26_ConsoleChampionsCup":108,"S26_DuosCashCup":93,"S26_DuosZBVictoryCashCup":93,"S26_FNCSCommunityCup":4,"S26_MixUpMondaysBR":93,"S26_MixUpMondaysZB":93,"S26_PerfEvaluation":93,"S26_PlaystationCupSeptember":93,"S26_PlaystationCupZBSeptember":93,"S26_SoloVictoryCashCup":93,"S27_DuosZBVictoryCashCup":93,"S27_OGAmar_Duos":93,"S27_OGGrefg_Duos":93,"S27_OGGrefg_Squads":93,"S27_OGInoxtag_Duos":93,"S27_OGJacob_Duos":93,"S27_RankedCupBronzeDuos":109,"S27_RankedCupBronzeSolo":109,"S27_RankedCupBronzeSquads":109,"S27_RankedCupDiamondDuos":109,"S27_RankedCupDiamondSolo":109,"S27_RankedCupDiamondSquads":109,"S27_RankedCupGoldDuos":109,"S27_RankedCupGoldSolo":109,"S27_RankedCupGoldSquads":109,"S27_RankedCupPlatinumDuos":109,"S27_RankedCupPlatinumSolo":109,"S27_RankedCupPlatinumSquads":109,"S27_RankedCupSilverDuos":109,"S27_RankedCupSilverSolo":109,"S27_RankedCupSilverSquads":109,"S27_RankedCupZBBronzeDuos":109,"S27_RankedCupZBBronzeSolo":109,"S27_RankedCupZBBronzeSquads":109,"S27_RankedCupZBDiamondDuos":109,"S27_RankedCupZBDiamondSolo":109,"S27_RankedCupZBDiamondSquads":109,"S27_RankedCupZBGoldDuos":109,"S27_RankedCupZBGoldSolo":109,"S27_RankedCupZBGoldSquads":109,"S27_RankedCupZBPlatinumDuos":109,"S27_RankedCupZBPlatinumSolo":109,"S27_RankedCupZBPlatinumSquads":110,"S27_RankedCupZBSilverDuos":109,"S27_RankedCupZBSilverSolo":109,"S27_RankedCupZBSilverSquads":109,"S27_SoloVictoryCashCup":93,"S28_ConsoleCashCupsZB":103,"S28_ConsoleCashCups":103,"S28_DuosCashCup":93,"S28_DuosZBVictoryCashCup":93,"S28_FNCSCommunityCups_v1":107,"S28_FNCSCommunityCups_v2":4,"S28_FNCS_Major1_GrandFinals":107,"S28_FNCS_Major1_Qualifier1":107,"S28_FNCS_Major1_Qualifier2":107,"S28_FNCS_Major1_SemiFinalLowerBracket":107,"S28_FNCS_Major1_SemiFinalUpperBracket":107,"S28_MixUpMondaysBR":93,"S28_MixUpMondaysZB":93,"S28_PerformanceEvaluation":93,"S28_PlaystationCupDecember":96,"S28_PlaystationCupZBDecember":93,"S28_RankedCupBronzeDuos":109,"S28_RankedCupBronzeSolo":109,"S28_RankedCupBronzeSquads":109,"S28_RankedCupDiamondDuos":109,"S28_RankedCupDiamondSolo":109,"S28_RankedCupDiamondSquads":109,"S28_RankedCupGoldDuos":109,"S28_RankedCupGoldSolo":109,"S28_RankedCupGoldSquads":109,"S28_RankedCupPlatinumDuos":109,"S28_RankedCupPlatinumSolo":109,"S28_RankedCupPlatinumSquads":109,"S28_RankedCupSilverDuos":109,"S28_RankedCupSilverSolo":109,"S28_RankedCupSilverSquads":109,"S28_RankedCupZBBronzeDuos":109,"S28_RankedCupZBBronzeSolo":109,"S28_RankedCupZBBronzeSquads":109,"S28_RankedCupZBDiamondDuos":109,"S28_RankedCupZBDiamondSolo":109,"S28_RankedCupZBDiamondSquads":109,"S28_RankedCupZBGoldDuos":109,"S28_RankedCupZBGoldSolo":109,"S28_RankedCupZBGoldSquads":109,"S28_RankedCupZBPlatinumDuos":109,"S28_RankedCupZBPlatinumSolo":109,"S28_RankedCupZBPlatinumSquads":110,"S28_RankedCupZBSilverDuos":109,"S28_RankedCupZBSilverSolo":109,"S28_RankedCupZBSilverSquads":109,"S28_SoloVictoryCashCup":93,"S29_ConsoleCashCupsZB":106,"S29_ConsoleCashCups":106,"S29_DuosCashCup":93,"S29_DuosZBVictoryCashCup":106,"S29_FNCSCommunityCups_v1":107,"S29_FNCSCommunityCups_v2":4,"S29_FNCS_Major2_GrandFinals":107,"S29_FNCS_Major2_Qualifier1":107,"S29_FNCS_Major2_Qualifier2":107,"S29_FNCS_Major2_SemiFinalLowerBracket":107,"S29_FNCS_Major2_SemiFinalUpperBracket":107,"S29_MixUpMondaysBR":93,"S29_MixUpMondaysZB":93,"S29_PerformanceEvaluation":93,"S29_PlaystationCupMarch":96,"S29_PlaystationCupZBMarch":93,"S29_RankedCupBronzeDuos":109,"S29_RankedCupBronzeSolo":109,"S29_RankedCupBronzeSquads":109,"S29_RankedCupDiamondDuos":109,"S29_RankedCupDiamondSolo":109,"S29_RankedCupDiamondSquads":109,"S29_RankedCupEliteDuos":109,"S29_RankedCupEliteSolo":109,"S29_RankedCupEliteSquads":109,"S29_RankedCupGoldDuos":109,"S29_RankedCupGoldSolo":109,"S29_RankedCupGoldSquads":109,"S29_RankedCupPlatinumDuos":109,"S29_RankedCupPlatinumSolo":109,"S29_RankedCupPlatinumSquads":109,"S29_RankedCupSilverDuos":109,"S29_RankedCupSilverSolo":109,"S29_RankedCupSilverSquads":109,"S29_RankedCupZBBronzeDuos":109,"S29_RankedCupZBBronzeSolo":109,"S29_RankedCupZBBronzeSquads":109,"S29_RankedCupZBDiamondDuos":109,"S29_RankedCupZBDiamondSolo":109,"S29_RankedCupZBDiamondSquads":109,"S29_RankedCupZBEliteDuos":109,"S29_RankedCupZBEliteSolo":109,"S29_RankedCupZBEliteSquads":109,"S29_RankedCupZBGoldDuos":109,"S29_RankedCupZBGoldSolo":109,"S29_RankedCupZBGoldSquads":109,"S29_RankedCupZBPlatinumDuos":109,"S29_RankedCupZBPlatinumSolo":109,"S29_RankedCupZBPlatinumSquads":110,"S29_RankedCupZBSilverDuos":109,"S29_RankedCupZBSilverSolo":109,"S29_RankedCupZBSilverSquads":109,"S29_RiseofMidasCup":111,"S29_SoloVictoryCashCup":106,"S30_ConsoleCashCups":106,"S30_DuosCashCupZB":93,"S30_DuosCashCup":93,"S30_FNCSCommunityCups_v1":107,"S30_FNCSCommunityCups_v2":4,"S30_FNCS_Major3_GrandFinals":107,"S30_FNCS_Major3_Qualifier1":107,"S30_FNCS_Major3_Qualifier2":107,"S30_FNCS_Major3_SemiFinalLowerBracket":107,"S30_FNCS_Major3_SemiFinalUpperBracket":107,"S30_MetallicaCup":101,"S30_NickEh":105,"S30_OpenDuosCupBR":93,"S30_OpenDuosCupZB":101,"S30_OpenTriosCupBR":93,"S30_OpenTriosCupZB":101,"S30_PerformanceEvaluation":93,"S30_PlaystationCupJune":96,"S30_PlaystationCupZBJune":93,"S30_RankedCupBSGDuos":109,"S30_RankedCupBSGSolo":109,"S30_RankedCupBSGSquads":109,"S30_RankedCupEliteDuos":109,"S30_RankedCupEliteSolo":109,"S30_RankedCupEliteSquads":109,"S30_RankedCupPDDuos":109,"S30_RankedCupPDSolo":109,"S30_RankedCupPDSquads":109,"S30_RankedCupZBBSGDuos":109,"S30_RankedCupZBBSGSolo":109,"S30_RankedCupZBBSGSquads":109,"S30_RankedCupZBPlatinumDuos":109,"S30_RankedCupZBPlatinumSolo":109,"S30_RankedCupZBPlatinumSquads":110,"S30_ReloadZB":93,"S30_Reload":93,"S30_SoloVictoryCashCup":106,"S30_SoloZBVictoryCashCup":106,"S30_SquadsVictoryCashCup":106,"S30_d4vd_Cup":93,"S31_DuosCashCupZB":101,"S31_DuosCashCup":93,"S31_FNCSCommunityCups_KunoRenzo":4,"S31_FNCSCommunityCups_Kyra":4,"S31_FNCSCommunityCups_Siren":107,"S31_FNCSCommunityCups_Sparkplug":107,"S31_FNCSCommunityCups_Stashd":107,"S31_InfluencerCup":93,"S31_PerformanceEvaluation":93,"S31_PlatformReloadDuosCashCupConsole":93,"S31_PlatformReloadDuosCashCupMobile":93,"S31_PlatformReloadDuosCashCupPC":93,"S31_PlaystationSypherPKCup":93,"S31_RankedCupBRBSGDuos":109,"S31_RankedCupBREliteDuos":109,"S31_RankedCupBRPDDuos":109,"S31_RankedCupBSGDuos":109,"S31_RankedCupEliteDuos":109,"S31_RankedCupPDDuos":109,"S31_RankedCupZBBSGDuos":109,"S31_RankedCupZBPlatinumDuos":109,"S31_RankedCupZB_BSGDuos":109,"S31_RankedCupZB_PlatinumDuos":109,"S31_RubiusIconCup":112,"S31_SoloVictoryCashCup":106,"S31_SoloZBVictoryCashCup":106,"S31_SquadsReloadCup":93,"S31_SymbioteCup":106,"S31_TriosCashCup":93,"S32_FNCSCommunityCups":107,"S32_PerformanceEvaluation":93,"S32_PlatformReloadDuosCashCupConsole":93,"S32_PlatformReloadDuosCashCupMobile":93,"S32_PlatformReloadDuosCashCupPC":93,"S32_RankedCupBSGDuos":109,"S32_RankedCupBSGSolo":109,"S32_RankedCupEliteDuos":109,"S32_RankedCupEliteSolo":109,"S32_RankedCupPDDuos":109,"S32_RankedCupPDSolo":109,"S32_RankedCupZBBSGDuos":109,"S32_RankedCupZBBSGSolo":109,"S32_RankedCupZBPlatinumDuos":109,"S32_RankedCupZBPlatinumSolo":109,"S32_SoloVictoryCashCup":113,"S32_SoloZBVictoryCashCup":113,"S32_SquadsReloadCup":93,"S32_TriosCashCup":93,"S32_TriosCashCup_ZB":101,"S33_FNCSCommunityCups":107,"S33_FNCSDivisionalCup_Division1":107,"S33_FNCSDivisionalCup_Division2":107,"S33_FNCSDivisonalCup_Division3":107,"S33_FNCSMajor1_Final":114,"S33_FNCSMajor1_GroupStage":114,"S33_FNCSMajor1_LastChanceQualifier":115,"S33_FNCSMajor1_PlayInStage":115,"S33_FNCS_Trial":107,"S33_OGCommunityCupZB":93,"S33_OGCommunityCup":93,"S33_OGCupZB":93,"S33_OGCup":93,"S33_PerformanceEvaluation":93,"S33_PlaystationCup":96,"S33_RankedCupBSGDuos":109,"S33_RankedCupBSGSolo":109,"S33_RankedCupBSSolo":109,"S33_RankedCupEliteDuos":109,"S33_RankedCupEliteSolo":109,"S33_RankedCupPDDuos":109,"S33_RankedCupPDSolo":109,"S33_SoloCashCup":101,"S34_ClixIconCup":116,"S34_EliteZadieCup":117,"S34_FNCSCommunityCups":118,"S34_FNCSDivisionalCup_Division1":119,"S34_FNCSDivisionalCup_Division2":119,"S34_FNCSDivisionalCup_Division3":119,"S34_FNCSMajor2_Final":114,"S34_FNCSMajor2_GroupStage":115,"S34_FNCSMajor2_LastChanceQualifier":115,"S34_FNCSMajor2_PlayInStage":115,"S34_LanternFestCup":120,"S34_OGCupZB":121,"S34_OGCup":121,"S34_PerformanceEvaluationReloadAll":122,"S34_PerformanceEvaluationReload":122,"S34_PerformanceEvaluation":122,"S34_PlaystationCup":123,"S34_RankedCupBSGDuos":124,"S34_RankedCupBSGSolo":124,"S34_RankedCupEliteDuos":124,"S34_RankedCupEliteSolo":124,"S34_RankedCupPDDuos":124,"S34_RankedCupPDSolo":124,"S34_ShoheiOhtaniCup":125,"S34_SoloCashCup":126,"S34_ThunderboltsCup":127,"S35_FNCSCommunityCups_Bugha":128,"S35_FNCSCommunityCups_Clix":128,"S35_FNCSCommunityCups_Lachlan":128,"S35_FNCSCommunityCups_Loserfruit":128,"S35_FNSCShowdown":129,"S35_OGCupZB":121,"S35_OGCup":121,"S35_PerformanceEvaluation":122,"S35_RankedCupBSGDuos":130,"S35_RankedCupBSGSolo":130,"S35_RankedCupBSGTrios":130,"S35_RankedCupEliteDuos":130,"S35_RankedCupEliteSolo":130,"S35_RankedCupEliteTrios":130,"S35_RankedCupPDDuos":130,"S35_RankedCupPDSolo":130,"S35_RankedCupPDTrios":130,"S35_ReloadRankedCup_BSG_Duos":130,"S35_ReloadRankedCup_Elite_Duos":130,"S35_ReloadRankedCup_PD_Duos":130,"S35_VictoryDuosCup":131,"S36_FNCSCommunityCup":132,"S36_FNCSDivisionalCup_Division1":119,"S36_FNCSDivisionalCup_Division2":119,"S36_FNCSDivisionalCup_Division3":119,"S36_FNCSMajor3_Final":114,"S36_FNCSMajor3_GroupStage":115,"S36_FNCSMajor3_LastChanceQualifier":115,"S36_FNCSMajor3_PlayInStage":115,"S36_FantasticFourCups":133,"S36_OGCups_BR":121,"S36_OGCups_ZB":121,"S36_PerformanceEvaluation":122,"S36_PlayStationCup":123,"S36_RangerCup_Pink":134,"S36_RangerCup_Red":135,"S36_RankedCupReloadDuos":130,"S36_RankedCupSolo":130,"S36_RankedCupTrios":130,"S36_SquidGroundVictoryDuosCup":136,"S36_SquidGroundsCups":137,"S36_VictoryDuosCup":131,"S37_AceWildCardCup":138,"S37_AceWildCardCup_Group2":138,"S37_AceWildCardCup_Group3":138,"S37_AxeOfChampionsCup":138,"S37_AxeOfChampsBlitzMobileCup":138,"S37_BladeOfChampsCupGroup2":138,"S37_BladeOfChampsCupGroup3":138,"S37_BladeOfChampsCup":138,"S37_BlitzCupOneSwing":139,"S37_BlitzCupsAllPlatforms":139,"S37_BlitzCups":139,"S37_BlitzMobileCupWeekly":139,"S37_BlitzMobileCup":139,"S37_ChampionCrystalCup":138,"S37_ChampionPJCup":138,"S37_ConsoleDuosCashCups":131,"S37_DuosDivisionalCupTrial":140,"S37_DuosDivisionalCup_Division1":141,"S37_DuosDivisionalCup_Division2":141,"S37_DuosDivisionalCup_Division3":141,"S37_DuosDivisionalCup_Division4":141,"S37_DuosDivisionalCup_Division5":141,"S37_EarlyAccessCup":142,"S37_EliteZadieCup":143,"S37_EliteZadieCup_Group2":143,"S37_EliteZadieCup_Group3":143,"S37_FNCSCommunityCups_Bugha":138,"S37_FNCSCommunityCups_Clix":138,"S37_FNCSCommunityCups_Lachlan":138,"S37_FNCSCommunityCups_Loserfruit":138,"S37_FNCSDivisionalCup_Division1":7,"S37_FNCSDivisionalCup_Division2":7,"S37_FNCSDivisionalCup_Division3":7,"S37_FrenchWeekly":130,"S37_HauntedCupJason":144,"S37_HauntedCupWednesday":144,"S37_KaiCenatIconCup":145,"S37_MrSavageIconCup":146,"S37_OGCups_BR":121,"S37_OGCups_ZB":121,"S37_PerformanceEvaluationDuos":122,"S37_PerformanceEvaluation":122,"S37_PlayStationCup":147,"S37_RankedCupDuos":130,"S37_RankedCupReloadDuos":130,"S37_RankedCupSolo":130,"S37_ReloadQuickCup":148,"S37_ReloadQuickCup_Group2":148,"S37_ReloadQuickCup_Group3":148,"S37_SoloSeriesCup":149,"S37_SurfWitchBlitzMobileCup":8,"S37_SurfWitchCup":8,"S38_BlitzMobileCup":139,"S38_DuosVictoryCup":150,"S38_OGCup_BR":121,"S38_OGCup":121,"S38_OGCup_ZB":121,"S38_PerformanceEvaluation":122,"S38_PlayStationCupReload":147,"S38_RankedCupDuosBR":130,"S38_RankedCupDuosZB":130,"S38_RankedCupReloadDuos":130,"S38_RankedCupSolo":130,"S38_ReloadQuickCup":148,"S38_ReloadQuickCup_Group2":148,"S38_ReloadQuickCup_Group3":148,"S38_SoloSeriesCup":149,"S38_SquadsVictoryCup":150,"S38_StrangerThingsCup":151,"S38_StrangerThingsMobileCup":151,"S38_TouchOnlyMobileCup":139,"S39_1MillionUnrealCup":152,"S39_BleachCup":153,"S39_DuosConsoleVictoryCupZB_Jan":150,"S39_DuosVictoryCup":150,"S39_FNCSDivisionalCupTrial":6,"S39_FNCSDivisionalCup_Division1":6,"S39_FNCSDivisionalCup_Division2":6,"S39_FNCSDivisionalCup_Division3":6,"S39_FNCSDivisionalCup_Division4":6,"S39_FNCSDivisionalCup_Division5":6,"S39_KPDHCup":154,"S39_KizunaAICupMobile":155,"S39_KizunaAICup":155,"S39_LanternFestCupMobile":156,"S39_LanternFestCup":156,"S39_MobileSeriesCupFebQual":157,"S39_MobileSeriesCupJanQual":157,"S39_MobileSeriesCupMarQual":157,"S39_MobileSeriesFeb":157,"S39_MobileSeriesJan":157,"S39_MobileSeriesMar":157,"S39_NvidiaCup":158,"S39_PerformanceEvaluation":122,"S39_PickleRickCup":159,"S39_PlayStationCupZB":160,"S39_PlayStationCup":160,"S39_RankedCupDuosBR":130,"S39_RankedCupDuosZBJan":130,"S39_RankedCupReloadDuosDec":161,"S39_RankedCupReloadDuosJan":130,"S39_RankedCupSoloDec":161,"S39_RankedCupSoloJan":130,"S39_ReloadCashVictoryCup_Dec":162,"S39_ReloadCashVictoryCup_Jan":150,"S39_ReloadEliteSeries1Final":163,"S39_ReloadEliteSeries1Heat1":163,"S39_ReloadEliteSeries1Heat2":163,"S39_ReloadEliteSeries1Heat3":163,"S39_ReloadEliteSeries1Heat4":163,"S39_ReloadEliteSeries1Opens":163,"S39_ReloadEliteSeries1PlayIn":163,"S39_ReloadEliteSeries2Final":163,"S39_ReloadEliteSeries2Heat1":163,"S39_ReloadEliteSeries2Heat2":163,"S39_ReloadEliteSeries2Heat3":163,"S39_ReloadEliteSeries2Heat4":163,"S39_ReloadEliteSeries2Opens":163,"S39_ReloadEliteSeries2PlayIn":163,"S39_SoloLevelingCup":164,"S39_SoloLevelingMobileCup":164,"S39_SoloSeriesCupFinal":149,"S39_SoloSeriesCupHeats":149,"S39_SoloSeriesCup":149,"S39_SoloVictoryCup":150,"S40_BakMobileCup":165,"S40_CashCup_TriosZB":166,"S40_ChampionKorFNCSCupMobile":167,"S40_ChampionKorFNCSCup":167,"S40_ConsoleCC_TriosZB":150,"S40_ConsoleVCC_SolosZB":150,"S40_DuckythegamerCupMobile":168,"S40_DuosReloadVictoryCup":150,"S40_FNCSDivisionalCup_Division1":6,"S40_FNCSDivisionalCup_Division2":6,"S40_FNCSDivisionalCup_Division3":6,"S40_FNCSDivisionalCup_Division4":6,"S40_FNCSDivisionalCup_Division5":6,"S40_FNCSMajor1_Final":6,"S40_FNCSMajor1_HeatsStage":6,"S40_FNCSMajor1_LastChanceQualifier":6,"S40_FNCSMajor1_PlayInStage":6,"S40_FNCSMajor1_SecondChance":6,"S40_MandalorianCup":169,"S40_MandalorianCup_ZB":169,"S40_MandalorianMobileCup":169,"S40_MobileSeriesApr":157,"S40_MobileSeriesCupQual":157,"S40_MobileSeriesMar":157,"S40_MobileSeriesMay":157,"S40_PerformanceEvaluationReload":122,"S40_PerformanceEvaluation":122,"S40_PlayStationCupClixZB":170,"S40_PlayStationCupClix":170,"S40_PlayStationCupMrSavageZB":170,"S40_PlayStationCupMrSavage_Final":170,"S40_PlayStationCupMrSavage_Qualifier":170,"S40_RankedCupDuosZB":130,"S40_RankedCupDuos":130,"S40_RankedCupReloadDuos":130,"S40_RankedCupSolo":130,"S40_ReloadEliteSeries3Final":163,"S40_ReloadEliteSeries3Heat1":163,"S40_ReloadEliteSeries3Heat2":163,"S40_ReloadEliteSeries3Heat3":163,"S40_ReloadEliteSeries3Heat4":163,"S40_ReloadEliteSeries3Opens":163,"S40_ReloadEliteSeries3PlayIn":163,"S40_ShowdownSeries_BuffPerryCup":171,"S40_ShowdownSeries_BuzzLightyearCup":171,"S40_ShowdownSeries_DaffyCup":172,"S40_ShowdownSeries_DrDoofenshmirtzCup":172,"S40_ShowdownSeries_EmperorZurgCup":172,"S40_ShowdownSeries_JonSnow":171,"S40_ShowdownSeries_NightKing":172,"S40_SoloVictoryCup":150,"S40_SpidergamerCupMobile":173,"S40_TheDonatoMobileCup":174,"S40_TripleThreatCup":175,"S40_TripleThreatMobileCup":175,"S40_TypicalGamerCup":176,"S41_ConsoleVCC_SolosZB":150,"S41_DavidBeckham":177,"S41_DavidBeckham_ZB":177,"S41_FNCSCommunityCup":167,"S41_FNCSCommunityCup_Mobile":167,"S41_FNCSCommunityCup_ZB":167,"S41_FNCSDivisionalCup_Division1":6,"S41_FNCSDivisionalCup_Division2":6,"S41_FNCSDivisionalCup_Division3":6,"S41_FNCSDivisionalCup_Division4":6,"S41_FNCSDivisionalCup_Division5":6,"S41_FNCSLastChanceMajor":6,"S41_FNCSMajor2_Final":6,"S41_FNCSMajor2_HeatsStage":6,"S41_FNCSMajor2_LastChanceQualifier":6,"S41_FNCSMajor2_PlayInStage":6,"S41_MobileSeriesCupQual":157,"S41_MobileSeriesHeat1":157,"S41_MobileSeriesHeat2":157,"S41_MobileSeriesHeat3":157,"S41_MobileSeriesHeat4":157,"S41_MobileSeriesOpen":157,"S41_MobileVictoryCup_BR":150,"S41_MobileVictoryCup_RES":150,"S41_MobileVictoryCup_ReloadminiV":150,"S41_MobileVictoryCup_ZBReload":150,"S41_MobileVictoryCup_ZB":150,"S41_MongraalIconCup":178,"S41_PSCupDaysOfPlay":160,"S41_PSCupDaysOfPlay_ZB":160,"S41_PSTypicalGamer":170,"S41_PSTypicalGamer_ZB":170,"S41_PerformanceEvaluationReload":122,"S41_PerformanceEvaluation":122,"S41_RankedCupDuosZB":130,"S41_RankedCupDuos":130,"S41_RankedCupReloadDuos":130,"S41_RankedCupSoloReload":130,"S41_RankedCupSolo":130,"S41_ReloadEliteSeries4Final":163,"S41_ReloadEliteSeries4Heat1":163,"S41_ReloadEliteSeries4Heat2":163,"S41_ReloadEliteSeries4Heat3":163,"S41_ReloadEliteSeries4Heat4":163,"S41_ReloadEliteSeries4Opens":163,"S41_ReloadEliteSeries4PlayIn":163,"S41_ReloadReloadSoloVictoryCup":150,"S41_SoloVictoryCup":150,"S41_SupergirlCup":179,"S41_SupergirlCup_ZB":179,"S41_SupergirlMobileCup":179,"S41_TheOdysseyCup":180,"S41_TheOdysseyCup_Mobile":180,"S41_TheOdysseyCup_ZB":180,"S41_ViniJr":179,"S41_ViniJr_Mobile":179,"S41_ViniJr_ZB":179,"S42_ArenaPerfEval":181,"S42_ChampionFocusFNCSCup":182,"S42_ChampionFocusFNCSCup_ZB":182,"S42_ChampionFocusFNCSMobileCup":182,"S42_ConsoleVCC_SolosZB":150,"S42_CrashBandicootCup":183,"S42_CrashBandicootCup_ZB":183,"S42_CrashBandicootMobileCup":183,"S42_CyperpranksCup":183,"S42_CyperpranksCup_Mobile":183,"S42_CyperpranksCup_ZB":183,"S42_FNCSDivisionalCup_Division1":6,"S42_FNCSDivisionalCup_Division2":6,"S42_FNCSDivisionalCup_Division3":6,"S42_FNCSDivisionalCup_Division4":6,"S42_FNCSDivisionalCup_Division5":6,"S42_FNCSSoloFastTracks":6,"S42_FNCSSoloQualifiers":6,"S42_FNCSSolo_Final":6,"S42_FNCSSolo_HeatsStage":6,"S42_FNCSSolo_LastChanceQualifier":6,"S42_IronmouseIconCup":184,"S42_IronmouseIconCup_ZB":184,"S42_KingdomHeartsCup":185,"S42_KingdomHeartsCup_Mobile":185,"S42_KingdomHeartsCup_ZB":185,"S42_MadisonBeerIconCup":186,"S42_MadisonBeerIconCup_Mobile":186,"S42_MadisonBeerIconCup_ZB":186,"S42_MegaManCup":183,"S42_MegaManCup_Mobile":183,"S42_MegaManCup_ZB":183,"S42_MobileSeriesCupSemiFinal":157,"S42_MobileSeriesGroup1":157,"S42_MobileSeriesGroup2":157,"S42_MobileSeriesLCQ":157,"S42_MobileVictoryCup_ReloadminiV":150,"S42_PSNickEh30":170,"S42_PSNickEh30_ZB":170,"S42_PerformanceEvaluation":122,"S42_Persona5Cup":183,"S42_Persona5Cup_Mobile":183,"S42_Persona5Cup_ZB":183,"S42_RankedCupDuos":130,"S42_RankedCupDuos_ZB":130,"S42_RankedCupReloadDuos":130,"S42_RankedCupReloadDuos_ZB":130,"S42_RankedCupSoloReload":130,"S42_RankedCupSoloReload_ZB":130,"S42_RankedCupSolo":130,"S42_RankedCupSolo_ZB":130,"S42_ReloadDuosVictoryCup":150,"S42_ReloadReloadSoloVictoryCup":150,"S42_ShadowCup":187,"S42_ShadowCup_Mobile":187,"S42_ShadowCup_ZB":187,"S42_SoloVictoryCup":150,"S42_TheHectorino_Mobile":188,"S42_WeezyIconCup":189,"S42_WeezyIconCup_ZB":189,"ScallywagCup":5,"ShareTheLove_Champion_Duo":190,"ShareTheLove_Champion_Solo":190,"ShareTheLove_Contender_Duo":190,"ShareTheLove_Contender_Solo":190,"ShareTheLove_Open_Duo":190,"ShareTheLove_Open_Solo":190,"ShareTheLove_Placement_Duo":190,"ShareTheLove_Placement_Solo":190,"ShareTheLove_Prospect_Duo":190,"ShareTheLove_Prospect_Solo":190,"SourDropper_LoveAndWar":191,"SourDropper_WeekendTournament_Day1":192,"SourDropper_WeekendTournament_Day2":192,"TriosOneDayCup1EU":1,"WorldCupWarmup":193,"XboxCup_Solo1":194,"s20_FridayNightZeroBuild":195,"s20_LCArchitectSolos":42,"s20_TriosHypeCup_Open":89};
/* EVENT COLORS end */
/* ТАБЛИЦЫ В ЦВЕТАХ ТУРНИРА, как лидерборд в игре тех лет (его просьба 28.09): у каждого
   события Epic своя палитра (imp_event.Colors — фон слева/справа, выделение, заголовок).
   Капы и события Epic — по своему id; FNCS прошлых лет (MajorN_YYYY) — по сезону дня;
   World Cup 2019 — палитра Online Open; своё (ЛАН, Кубок наций) — сезон, иначе бирюза как была. */
// Номер сезона Fortnite на дату — по спискам сезонов всех лет, а не только года карьеры.
function ccSeasonNumOn(day){
  const d=String(day||'');
  // Год главы по кругу (2027+, ccCycleSlot): сезон — тот, чей остров стоит в этот день.
  try{ if(typeof ccCycleSlot==='function' && d){ const cy=ccCycleSlot(d); if(cy) return cy[1]; } }catch(e){}
  const lists=[typeof CC_SEASONS_2019!=='undefined'?CC_SEASONS_2019:[], typeof CC_SEASONS_2020!=='undefined'?CC_SEASONS_2020:[],
    typeof CC_SEASONS_2021!=='undefined'?CC_SEASONS_2021:[], typeof CC_SEASONS_2022!=='undefined'?CC_SEASONS_2022:[],
    typeof CC_SEASONS_2023!=='undefined'?CC_SEASONS_2023:[], typeof CC_SEASONS_2024!=='undefined'?CC_SEASONS_2024:[],
    typeof CC_SEASONS_2025!=='undefined'?CC_SEASONS_2025:[], typeof CC_SEASONS!=='undefined'?CC_SEASONS:[]];
  const s=[].concat.apply([], lists).find(x=>d>=x.from && d<=x.to);
  if(s) return +String(s.id).slice(1);
  const f=(typeof careerFncsSeason==='function') ? careerFncsSeason(d) : null;
  return f ? +String(f.id).slice(1) : 0;
}
/* ГЛАВА И СЕЗОН ПО НОМЕРУ (его правка 29.09, Notion «27» скрин 24: «пусть больше информации
   будет, какой сезон и чаптер»). Нумерация Fortnite: S1–S10 — Глава 1, S11–S18 — Глава 2,
   S19–S22 — Глава 3, S23–S26 — Глава 4 и S27 — OG, S28–S31 — Глава 5 и S32 — Remix, S33–S37 —
   Глава 6 (S35 — мини-сезон Galactic Battle, дальше счёт главы идёт с S36 как с сезона 3),
   S38 — мини-сезон, S39–S42 — Глава 7 (S42 — Override), S43 — мини-сезон Treasure Hunters. Дальше только «S44». */
function ccChapterOf(n){
  if(!(n>0)) return null;
  if(n<=10) return {c:1, s:n};
  if(n<=18) return {c:2, s:n-10};
  if(n<=22) return {c:3, s:n-18};
  if(n<=26) return {c:4, s:n-22};
  if(n===27) return {c:4, name:'OG'};
  if(n<=31) return {c:5, s:n-27};
  if(n===32) return {c:5, name:'Remix'};
  if(n<=34) return {c:6, s:n-32};
  if(n===35) return {c:6, name:'Galactic Battle'};
  if(n<=37) return {c:6, s:n-33};
  if(n===38) return {c:6, name:'Simpsons'};
  if(n<=42) return {c:7, s:n-38};
  if(n===43) return {c:7, name:'Treasure Hunters'};
  return {n:n};
}
// Полное имя («Глава 2, сезон 5») и короткое («C2S5») сезона дня.
function ccSeasonTag(day){
  const n=ccSeasonNumOn(day), c=ccChapterOf(n), T=L();
  if(!c) return {full:'', short:''};
  if(c.n) return {full:'S'+c.n, short:'S'+c.n};
  if(c.name) return {full:T.ccChapterName(c.c, c.name), short:'C'+c.c+' '+c.name};
  return {full:T.ccChapterSeason(c.c, c.s), short:'C'+c.c+'S'+c.s};
}
/* Сезон в постах — «C7S2», а не внутренний номер «S40» (16.10, «сделай твиттер реалистичней»). */
function ccSeasonTagOf(season){ try{ return ccSeasonTag(season.from).short || season.id; }catch(e){ return season.id; } }
function ccEvPalOf(fam){ const i=CC_EV_COL[fam]; return i==null ? null : CC_EV_PAL[i]; }
function ccEvPalette(ev, day){
  if(!ev || typeof CC_EV_COL==='undefined') return null;
  const id=String(ev.id||ev.eid||'');
  let p=ccEvPalOf(id);
  if(!p && id){ const k=Object.keys(CC_EV_COL).find(f=>f.indexOf(id+'_')===0); if(k) p=ccEvPalOf(k); }
  if(p) return p;
  if(/^Major[12]_2019_/.test(id)) return ccEvPalOf(/Final/.test(id) ? (/^Major1/.test(id) ? 'ONSITE_WorldCup_Solos' : 'ONSITE_WorldCup_Duos') : 'OnlineOpen_Week1');
  const n=ccSeasonNumOn(day||careerToday());
  if(!n) return null;
  const fam=Object.keys(CC_EV_COL).filter(f=>new RegExp('^S'+n+'_FNCS').test(f));
  const pick=fam.find(f=>/Final/i.test(f)) || fam[0];
  return pick ? ccEvPalOf(pick) : null;
}
// Ставит палитру вечера на страницу: CSS-переменные --ev-* и класс ev-pal на <html>.
function ccEvPaletteApply(ev){
  const root=document.documentElement;
  /* 2026-й — свой вид сайта, без палитр событий (его правка 29.09: «с таблицами не то, не те
     цвета 2026» — Victory Cup красил таблицу в розово-оранжевый с бордовыми строками). Палитры
     турниров и экран тех лет — для прошлых годов, 2019–2025. */
  const own2026=!!(CAREER && CAREER.career) && ccCalYear()>=2026;
  /* Прошлый год без своей палитры у события (ЛАН, свой турнир) — палитра года, как у хаба
     (ccYearThemeApply): сезон дня, до Season X — Online Open 2019. Его правка 29.09: «пусть дизайн
     будет в стиле карьеры, в котором году он играет, а не синий, как в 26 году». */
  const past=!!(CAREER && CAREER.career) && ccCalYear()<2026;
  const dayP=()=>{ const d=careerToday(), n=ccSeasonNumOn(d);
    return ccEvPalette({id:''}, d) || (n<=9 ? ccEvPalOf('OnlineOpen_Week1') : null); };
  const p=own2026 ? null : (ccEvPalette(ev) || (past ? dayP() : null));
  if(!p){ root.classList.remove('ev-pal', 'ev-classic', 'ev-light'); return; }
  const s=root.style;
  s.setProperty('--ev-l', '#'+p[0]); s.setProperty('--ev-r', '#'+p[1]);
  s.setProperty('--ev-h', '#'+(p[2]||'FFE600'));
  s.setProperty('--ev-th', ccEvLight(p) ? '#0b0f16' : '#fff');
  root.classList.add('ev-pal');
  /* Прошлые годы — таблица как экран турнира в игре тех лет (скрины: Solos Cash Cup Europe
     2019, Solo Cash Cup Week 3 2020, Victory Cash Cup 2023): название события и регион крупно
     в самой таблице, полосы вместо плашек, лидер и своя строка — белые. 2026-й — свой вид. */
  const classic=(CAREER && CAREER.career) ? ccCalYear()<2026 : false;
  root.classList.toggle('ev-classic', classic);
  root.classList.toggle('ev-light', classic && ccEvLight(p));
  const q=v=>'"'+String(v||'').replace(/["\\]/g,'').toUpperCase()+'"';
  s.setProperty('--ev-name', q((ev && (ev.label||ev.title||ev.name))||''));
  let reg=''; try{ reg=regionName(ccCareerRegion()); }catch(e){}
  s.setProperty('--ev-reg', reg ? q('('+reg+')') : '""');
}
/* ТЕМА КАРЬЕРЫ ПО ГОДУ (его просьба 28.09: «дизайн карьеры под каждый год — разные палитры
   в годах были»). Хаб прошлых лет — в палитре FNCS текущего сезона (Epic, CC_EV_PAL):
   фон, шапка с постером сезона, плашки плиток, активная вкладка. 2026-й — как был (его
   бирюза и есть палитра года). До FNCS 2019-го (S8–S9) — палитра World Cup / Online Open. */
/* Выключено 29.09 его словом: «верни дизайн как было … главного меню и centre», «раньше
   выглядело лучше». Хаб и «Центр» снова в оформлении сайта; палитры турниров остаются у
   таблиц и экрана вечера (ccEvPaletteApply). Включить обратно — true. */
const CC_YEAR_THEME=false;
function ccYearThemeApply(){
  const root=document.documentElement;
  if(!CC_YEAR_THEME){ root.classList.remove('yr-pal'); return; }
  const today=(CAREER && CAREER.career) ? careerToday() : '';
  const y=today ? ccCalYear() : 2026;
  if(y>=2026){ root.classList.remove('yr-pal'); return; }
  const n=ccSeasonNumOn(today);
  const p=ccEvPalette({id:''}, today) || (n<=9 ? ccEvPalOf('OnlineOpen_Week1') : null);
  if(!p){ root.classList.remove('yr-pal'); return; }
  const s=root.style, art=ccSeasonArtOn(today);
  s.setProperty('--yr-l', '#'+p[0]); s.setProperty('--yr-r', '#'+p[1]);
  s.setProperty('--yr-h', '#'+(p[2]||'FFE600'));
  s.setProperty('--yr-hi', ccEvLight([p[2]||'FFE600','FFE600']) ? '#0b0f16' : '#fff');
  s.setProperty('--yr-art', art ? 'url('+art+')' : 'none');
  root.classList.add('yr-pal');
}
// Светлый ли фон палитры (серебро FNCS 2022–2025) — тогда шапка таблицы тёмная.
function ccEvLight(p){
  const lum=h=>{ const n=parseInt(h,16); return (0.299*(n>>16&255)+0.587*(n>>8&255)+0.114*(n&255))/255; };
  return (lum(p[0])+lum(p[1]))/2>0.62;
}
function ccCupPoster(id){
  id=String(id||'');
  let k=CC_CUP_POSTER[id];
  if(!k){ const m=/^SoloCash(\d+)_/.exec(id); if(m) k=+m[1]<=8 ? 'cups/s33' : 'cups/s34'; }
  if(!k && /^SoloSeries_/.test(id)) k='cups/ss39';
  return k ? 'art/'+k+'.jpg' : '';
}
/* FNCS прошлых лет — в постерах сезона из игры (архив Tracker, у сезона — постер финала, где он
   был): Season X, C2S1–C2S8, Grand Royale, C3S1–C3S3, Invitational 2022, C4S1–S3 и LCM, 2024.
   World Cup 2019 остаётся на своём ключевом арте, у 2025–2026 постеры Мейджоров уже свои. */
const CC_FNCS_POSTER={
  Major3_2019:'f10', Major4_2019:'f11',
  Major1_2020:'f12', Major2_2020:'f13', Major3_2020:'f14',
  Major1_2021:'f15', Major2_2021:'f16', Major3_2021:'f17', Major4_2021:'f18', Major5_2021:'f18gr',
  Major1_2022:'f19', Major2_2022:'f20', Major3_2022:'f21', Invitational2022:'f22inv',
  Major1_2023:'f23', Major2_2023:'f24', Major3_2023:'f25', Major4_2023:'f25',
  Major1_2024:'f28', Major2_2024:'f28', Major3_2024:'f28'
};
function ccFncsPoster(id){
  const m=/^(Major\d_\d{4}|Invitational2022)/.exec(String(id||''));
  const k=m && CC_FNCS_POSTER[m[1]];
  return k ? 'art/cups/'+k+'.jpg' : '';
}
// Обложка события: постер FNCS сезона, потом по id, потом постер капа, потом по виду. Одна дверь для календаря и карточки.
// Календарь хранит у своего турнира только id: аватарку берём из записи турнира.
function ccOwnLogoOf(ev){
  if(!ev) return '';
  if(ev.own && ev.logo) return ev.logo;
  const id=String(ev.id||ev.eid||''); if(id.indexOf('OWN_')!==0) return '';
  const cr=typeof CAREER!=='undefined' && CAREER && CAREER.career;
  const c=cr && (cr.ownCups||[]).find(x=>x.id===id);
  return (c && c.logo) || '';
}
function ccEventArt(ev){
  if(!ev) return '';
  const own=ccOwnLogoOf(ev); if(own) return own;
  const byId=ccFncsPoster(ev.id||ev.eid) || CAREER_EV_ART_ID[ev.id||ev.eid||''] || ccCupPoster(ev.id||ev.eid);
  if(byId) return byId;
  const k=ev.kind||ev.type||'';
  return CAREER_EV_ART[k==='cup'?'cup':k] || '';
}
/* Epic's 2026 competitive schedule, inlined from tools/fortnite-2026-year.generated.js
   (read off Tracker event pages, real BeginTime) so the career doesn't depend on tools/.
   Divisional cups live in CC_CUP_WEEKS. Row: [from, to, id, kind, shape]; kind is our own label
   for cover, pip colour and season square. shape 'pair' (Opens, Play-Ins): only the two endpoint
   dates run; no shape (Heats): every day in the range. Without it a cup with two Opens got nine. */
/* The year ends where the season does.
   It used to end on 23 August, two days after Paris, and that cut the season's
   own last event off the calendar: the Global Championship is in Antwerp on
   26-27 September 2026, which is where every road in this mode has been going
   all year. A career could win a seat there — the Summit, Major 2, the Last
   Chance all hand one out — and then the year simply stopped before the flight.
   The month between is the real gap between Paris and Antwerp, and it is
   training days, wages on 1 September and nothing else, which is what that
   month is. */
/* Хвост года дотянут до последнего измеренного вечера S42 — Перфоманс 9,
   22 октября, с его Tracker-сейвов 23 августа. Дальше Epic пока молчит. */
/* …молчал. 1 сентября Epic опубликовал правила FNCS Solos 2026, и последний
   вечер года — не Перфоманс, а финал соло 27 октября. Год дотянут до него:
   иначе турнир, ради которого весь октябрь и стоит на календаре, обрывался бы
   за пять дней до собственного финала. Даты — из Attachment B тех же правил,
   и они сходятся с окнами Epic по NAC до дня. */
/* Год кончается Кубком наций: три субботы после финала FNCS Solos, церемония 15 ноября. Слово
   21.09: «это может быть в конец года?». Раньше год закрывался 27 октября финалом Solos. */
/* 19.10: Epic объявил FNCS Solo Reload (3–22 ноября), и он сел на квал и финал Кубка наций.
   Настоящий турнир важнее выдуманного: Кубок наций уехал за его хиты (отбор 18.11, квал 25, финал 28),
   год дотянут до 29 ноября. */
const CC_YEAR_FROM='2025-12-01', CC_YEAR_TO='2026-11-29';
const CAREER_YEAR=[
  // Кубок наций — закрытие сезона (выдумка режима, см. ccNationsBook): после FNCS Solo Reload: отбор 18.11, квал 25.11, финал 28.11.
  ['2026-11-18','2026-11-18','NationsTrial','nations'],
  ['2026-11-25','2026-11-25','NationsQual','nations'],
  ['2026-11-28','2026-11-28','NationsFinal','nations'],
  /* FNCS Solo Reload, ноябрь 2026 — пост Fortnite Competitive 19.10 (x.com/FNCompetitive/status/2112236444211429766),
     две схемы Stage 1 и Stage 2. Машина та же, что у FNCS Solos (CC_SOLOS_STAGES, ключи rl*), остров — Reload.
     Round 1 (3–4.11) не играется по тому же правилу, что у Solos: поле его Epic не называет (порог «топ-200 000 PR»).
     Финал — один вечер 21 ноября во всех регионах (календарь Epic S43, снят 2.11; у NAC/NAW это 22-е по UTC). */
  ['2026-11-07','2026-11-07','FNCSSoloReload_Round2','solo'],
  ['2026-11-08','2026-11-08','FNCSSoloReload_Round3','solo'],
  ['2026-11-14','2026-11-15','FNCSSoloReload_Heats','solo'],
  ['2026-11-16','2026-11-16','FNCSSoloReload_LCQRound1','solo'],
  ['2026-11-17','2026-11-17','FNCSSoloReload_LCQFinal','solo'],
  ['2026-11-21','2026-11-21','FNCSSoloReload_Final','solo'],
  /* Solo Series, S39 — его два Tracker-сейва 23 августа (Solo Series Heats /
     Finals EU). Epic гнал квалификации четыре недели с 7 декабря, но карьера
     начинается 5 января — играется последняя, четвёртая сессия (11.01), и это
     честно по правилам Epic: в зачёт шла одна лучшая неделя. Хиты у Epic
     17-18 января (1-2 и 3-4), финал 24-25 — 12 игр одной посадкой, правило
     Глобалов. Кап есть в каждом из семи регионов и платит по своему региону
     — таблицы в CC_SOLO_PRIZES. 19 января не занято нарочно: там третий
     Duos Victory Cup. */
  /* ТРИ СЕССИИ КВАЛА, ИДЁТ ЛУЧШАЯ. Замер (tools/career-solo-qual-probe.js,
     60 прогонов на силу): с одной попытки в топ-100 из 4900 проходили 43% карт
     96, 33% — 88, 25% — 78; отзыв: «лучшими карточками даже в хиты не могу
     пройти». У Epic сессий было четыре и считалась лучшая — карьера даёт три
     на свободных днях первой недели (6, 10 и 11 января), правило то же: прошёл
     в одной — остальные не играются, не прошёл — играешь следующую. Форма
     'session' нумерует их в подписи. */
  ['2026-01-06','2026-01-06','SoloSeries_Qualifier','solo','session'],
  ['2026-01-10','2026-01-10','SoloSeries_Qualifier','solo','session'],
  ['2026-01-11','2026-01-11','SoloSeries_Qualifier','solo','session'],
  ['2026-01-17','2026-01-18','SoloSeries_Heats','solo'],
  ['2026-01-24','2026-01-25','SoloSeries_Final','solo'],
  ['2026-01-08','2026-01-16','ReloadEliteSeries1Opens','reload','pair'],
  ['2026-01-23','2026-01-28','ReloadEliteSeries1PlayIn','reload','pair'],
  ['2026-02-01','2026-02-01','ReloadEliteSeries1Heats','reload'],
  ['2026-02-07','2026-02-07','ReloadEliteSeries1Final','reload'],
  ['2026-02-13','2026-02-15','ReloadEliteSeries2Opens','reload','pair'],
  ['2026-02-20','2026-02-22','ReloadEliteSeries2PlayIn','reload','pair'],
  ['2026-02-27','2026-02-27','ReloadEliteSeries2Heats','reload'],
  ['2026-03-01','2026-03-01','ReloadEliteSeries2Final','reload'],
  ['2026-04-06','2026-04-07','Major1_PlayIn','major'],
  ['2026-04-17','2026-04-19','Major1_Heats','major'],
  ['2026-04-20','2026-04-21','Major1_LCQ','major'],
  ['2026-04-25','2026-04-26','Major1_Final','major'],
  // The Major 1 Summit, off the roster's own cards: the Group Stage is dated
  // 29 May 2026 and the Grand Finals 31 May, so the Lower Bracket sits between
  // them. Three days in Düsseldorf, and until now the career watched them go
  // past — the one FNCS event of the year it qualified for and never played.
  /* SECOND CHANCE QUALIFIER (Notion 20.10, игрок: «a cup to qual for globals if you didn't in grands of Major 1, only
     those who didn't qual and were div 1 could play, and who qualified go to the lower of summit»). Epic и Liquipedia:
     28 апреля открытый день для дивизиона 1 без места на Саммите, 29 апреля финал — 50 дуо, 6 игр, квоты регионов
     (EU 8, NAC 7, остальные по 2) в нижнюю сетку. */
  ['2026-04-28','2026-04-28','Summit_SCQPlay','summit'],
  ['2026-04-29','2026-04-29','Summit_SCQ','summit'],
  ['2026-05-29','2026-05-29','Summit_Upper','summit'],
  ['2026-05-30','2026-05-30','Summit_Lower','summit'],
  ['2026-05-31','2026-05-31','Summit_Final','summit'],
  ['2026-05-01','2026-05-03','ReloadEliteSeries3Opens','reload','pair'],
  ['2026-05-08','2026-05-10','ReloadEliteSeries3PlayIn','reload','pair'],
  ['2026-05-15','2026-05-15','ReloadEliteSeries3Heats','reload'],
  ['2026-05-17','2026-05-17','ReloadEliteSeries3Final','reload'],
  ['2026-06-12','2026-06-14','ReloadEliteSeries4Opens','reload','pair'],
  ['2026-06-19','2026-06-21','ReloadEliteSeries4PlayIn','reload','pair'],
  ['2026-06-26','2026-06-26','ReloadEliteSeries4Heats','reload'],
  ['2026-06-28','2026-06-28','ReloadEliteSeries4Final','reload'],
  ['2026-07-18','2026-07-19','Major2_PlayIn','major'],
  ['2026-07-24','2026-07-26','Major2_Heats','major'],
  ['2026-07-27','2026-07-28','Major2_LCQ','major'],
  ['2026-08-01','2026-08-02','Major2_Final','major'],
  // The Global Championship Last Chance is seven days, not two: two qualifiers
  // of three rounds and then a final. They are in CC_GCLC, because a 'pair' row
  // could only ever hold the first day and the last.
  // 19-22 August, Paris Expo Porte de Versailles: the Championship's own page
  // and the Esports World Cup's both say Wednesday to Saturday. This row was a
  // day early at both ends, which put the whole four-day block — and the seat
  // tile that names its opening day — on the wrong dates.
  ['2026-08-19','2026-08-22','ReloadChampionshipParis','gc'],
  // Antwerp, 26-27 September 2026. One cumulative leaderboard over the two days
  // rather than a bracket, so it is one stage and a career plays it on the
  // Saturday — the same rule the Heats and the Play-In already run under.
  ['2026-09-26','2026-09-27','GlobalChampionship','globals'],
  /* FNCS Solos 2026. Правила Epic fortnite-championship-series-fncs-solos-2026-official-rules: шесть стадий, поле
     100, финал два дня, топ EU 60 000. Даты из Attachment B.
     Играем Round 2 и 3 квала: из Round 1 проходят 8000 EU, 4000 NAC, 2000 остальные, дальше 1000, потом 100. R1 не
     играем: поля Epic не даёт.
     R3 первого круга ведёт в Fast Track, второго в хиты; второй круг только без места. 10 октября два
     взаимоисключающих вечера, решает careerSoloSeriesOn.
     LCQ Final: места 36-50 в хите или LCQ Round 1 (19 октября, поля нет, выход 70, открытая комната с отсечкой
     Epic). */
  ['2026-09-28','2026-09-28','FNCSSolos_Q1Round1','solo'],
  ['2026-10-03','2026-10-03','FNCSSolos_Q1Round2','solo'],
  ['2026-10-04','2026-10-04','FNCSSolos_Q1Round3','solo'],
  ['2026-10-05','2026-10-05','FNCSSolos_Q2Round1','solo'],
  ['2026-10-10','2026-10-10','FNCSSolos_FastTrack','solo'],
  ['2026-10-10','2026-10-10','FNCSSolos_Q2Round2','solo'],
  ['2026-10-11','2026-10-11','FNCSSolos_Q2Round3','solo'],
  // Два хита в два дня, каждый играет один (правила Epic: Heat 1 17.10, Heat 2 18.10; сверка 29.10).
  ['2026-10-17','2026-10-17','FNCSSolos_Heats','solo'],
  ['2026-10-18','2026-10-18','FNCSSolos_Heats2','solo'],
  ['2026-10-19','2026-10-19','FNCSSolos_LCQRound1','solo'],
  ['2026-10-20','2026-10-20','FNCSSolos_LCQFinal','solo'],
  ['2026-10-26','2026-10-27','FNCSSolos_Final','solo'],
  /* Pro-Am: Pro-Am Creator Series 2026, первая остановка 12 июля, Даллас (Comets
     LANding, UT Dallas, Epic + Dignitas). Вторая (6 сентября, Сан-Паулу) не взята:
     призов и очков ещё нет. По Liquipedia, сверено обратным счётом по таблице:
     Reload дуо, 20 команд в одном лобби, 7 игр, места 60/50/45/40/35/30/27/24/21/
     18/15/12/9/6/3, дальше 0, элим 3. Фонд $50 000 = $38 100 по местам + $11 900
     бонусов за игры ($1000/$500/$200 за 1-3). Поле по приглашению, квалификации у
     Epic нет; кого зовут, решает наша мерка careerProAmCan. */
  ['2026-07-12','2026-07-12','ProAm_Dallas','proam'],
  // Вторая остановка серии — Сан-Паулу, Zero Build. См. CC_PROAM_EVENTS.
  ['2026-09-06','2026-09-06','ProAm_SaoPaulo','proam'],
  /* Третья и четвёртая остановки — отзыв: «добавь 2 pro am ещё».
     Epic на этот день объявил только Даллас и Сан-Паулу («multiple events are
     planned throughout the year, each hosted by different organizations» —
     Liquipedia, next= пусто). Города и хозяева — НАШИ, по образцу серии (клуб
     принимает у себя): Париж, Team Vitality, воскресенье 20 сентября — свободный
     день за неделю до Антверпена; Сеул, Gen.G, воскресенье 25 октября — перед
     финалом FNCS Solos. Числа — Сан-Паулу (20 пар, 6 игр, $50 000), стройки как
     в Далласе. Объявит Epic другое — заменить даты и города здесь и в CC_PROAM_EVENTS. */
  ['2026-09-20','2026-09-20','ProAm_Paris','proam'],
  ['2026-10-25','2026-10-25','ProAm_Seoul','proam']
];
/* ---- The other year: FNCS 2025, in trios ------------------------------------
   Second calendar for trio years: 5 cup weeks, 3 Majors, Group Stage instead of
   Heats, a Last Chance Lobby, no Reload, no Summit, Globals 33 seats from Majors.
   EU dates from fortnitetracker.com window lists (epicgames_S3x_FNCS<event>_EU);
   season codes skip: C6S1 = S33, S2 = S34, S3 = S36. Play-In has no Tracker page,
   dates from the published schedule (Wed/Thu before Group Stage). S2 cup week 4
   Final is Monday 31 March on purpose: Week4Final_EU_mg was a make-good replay.
   Nothing reads this yet, see CC_YEAR_2025_FROM for what wiring still needs. */
const CAREER_YEAR_2025=[
  // Кубок наций — закрытие сезона, три субботы после последнего турнира FNCS (выдумка режима, см. ccNationsBook).
  ['2025-09-13','2025-09-13','NationsTrial','nations'],
  ['2025-09-20','2025-09-20','NationsQual','nations'],
  ['2025-09-27','2025-09-27','NationsFinal','nations'],
  /* Всё, что платило деньгами в сезоне 2025 (кроме FNCS) — с архива Tracker
     (events/archived?region=EU&year=2024|2025, imp_event.Windows с PayoutTable,
     снято 21 сентября 2026). Отзыв: «чет очень мало капов, добавляй все
     призовые, которые были». Консольные (PlayStation Cup, Console Victory Cash
     Cup) не взяты — карьера играется с ПК. Практика дивизионов S37 (14–30
     августа) не взята: её финал шёл в дуо, а дни — в трио, это тест нового
     формата, а не сезон.

     Solo Cash Cup — шестнадцать капов (восемь в S33, восемь в S34): раунд 1
     открытый, десять игр, топ-600 в раунд 2; раунд 2 десять игр, $32 000 на
     кап (№1 $8 000 … 21–25 $160). См. CC_SOLOS_STAGES (sc<n>r1 / sc<n>r2). */
  ['2024-12-15','2024-12-15','SoloCash1_R1','solo'],
  ['2024-12-15','2024-12-15','SoloCash1_R2','solo'],
  ['2024-12-20','2024-12-20','SoloCash2_R1','solo'],
  ['2024-12-22','2024-12-22','SoloCash2_R2','solo'],
  ['2025-01-10','2025-01-10','SoloCash3_R1','solo'],
  ['2025-01-12','2025-01-12','SoloCash3_R2','solo'],
  ['2025-01-17','2025-01-17','SoloCash4_R1','solo'],
  ['2025-01-19','2025-01-19','SoloCash4_R2','solo'],
  ['2025-01-24','2025-01-24','SoloCash5_R1','solo'],
  ['2025-01-26','2025-01-26','SoloCash5_R2','solo'],
  ['2025-02-01','2025-02-01','SoloCash6_R1','solo'],
  ['2025-02-02','2025-02-02','SoloCash6_R2','solo'],
  ['2025-02-05','2025-02-05','SoloCash7_R1','solo'],
  ['2025-02-06','2025-02-06','SoloCash7_R2','solo'],
  ['2025-02-17','2025-02-17','SoloCash8_R1','solo'],
  ['2025-02-18','2025-02-18','SoloCash8_R2','solo'],
  ['2025-03-07','2025-03-07','SoloCash9_R1','solo'],
  ['2025-03-09','2025-03-09','SoloCash9_R2','solo'],
  ['2025-03-14','2025-03-14','SoloCash10_R1','solo'],
  ['2025-03-16','2025-03-16','SoloCash10_R2','solo'],
  ['2025-03-23','2025-03-23','SoloCash11_R1','solo'],
  ['2025-03-24','2025-03-24','SoloCash11_R2','solo'],
  ['2025-03-28','2025-03-28','SoloCash12_R1','solo'],
  ['2025-03-30','2025-03-30','SoloCash12_R2','solo'],
  ['2025-04-04','2025-04-04','SoloCash13_R1','solo'],
  ['2025-04-06','2025-04-06','SoloCash13_R2','solo'],
  ['2025-04-11','2025-04-11','SoloCash14_R1','solo'],
  ['2025-04-12','2025-04-12','SoloCash14_R2','solo'],
  ['2025-04-17','2025-04-17','SoloCash15_R1','solo'],
  ['2025-04-18','2025-04-18','SoloCash15_R2','solo'],
  ['2025-04-25','2025-04-25','SoloCash16_R1','solo'],
  ['2025-04-29','2025-04-29','SoloCash16_R2','solo'],
  /* FNCS Showdown (S35, Galactic Battle): три капа для дивизионов 1–2 в трио,
     раунд 1 десять игр, топ-33 в раунд 2; раунд 2 шесть игр, $9 600 на игрока
     в сумме (№1 $3 000). Идёт машиной Мейджора как «Мейджор 4–6»: LCQ = раунд 1,
     финал = раунд 2. */
  ['2025-05-13','2025-05-13','Showdown4_2025_LCQ','major'],
  ['2025-05-14','2025-05-14','Showdown4_2025_Final','major'],
  ['2025-05-20','2025-05-20','Showdown5_2025_LCQ','major'],
  ['2025-05-21','2025-05-21','Showdown5_2025_Final','major'],
  ['2025-05-27','2025-05-27','Showdown6_2025_LCQ','major'],
  ['2025-05-28','2025-05-28','Showdown6_2025_Final','major'],
  // Major 1, Chapter 6 Season 1 (S33). Play-In is two days rather than one
  // window: a cumulative leaderboard over both, ten matches a day, top 99 in
  // Europe through to the Group Stage.
  ['2025-01-29','2025-01-30','Major1_2025_PlayIn','major'],
  // The Group Stage, which is not the 2026 Heats: three groups of the field, one
  // day each, five matches, and they are not consecutive days — Europe's first
  // group played the Sunday and the other two the weekend after it, with the
  // other six regions filling the days between. A career plays its own group, so
  // all three days are on the calendar and one of them is the player's.
  ['2025-02-02','2025-02-02','Major1_2025_Group1','major'],
  ['2025-02-08','2025-02-08','Major1_2025_Group2','major'],
  ['2025-02-09','2025-02-09','Major1_2025_Group3','major'],
  // The back door is two stages in 2025, not one: a ten-match qualifier that
  // cuts to thirty-three, and then a three-match Lobby where a Victory Royale is
  // the ticket. 2026 folded both into a single Last Chance Qualifier day.
  ['2025-02-12','2025-02-12','Major1_2025_LCQ','major'],
  ['2025-02-13','2025-02-13','Major1_2025_LCLobby','major'],
  ['2025-02-15','2025-02-16','Major1_2025_Final','major'],

  // Major 2, Chapter 6 Season 2 (S34).
  ['2025-04-09','2025-04-10','Major2_2025_PlayIn','major'],
  ['2025-04-13','2025-04-13','Major2_2025_Group1','major'],
  ['2025-04-19','2025-04-19','Major2_2025_Group2','major'],
  ['2025-04-20','2025-04-20','Major2_2025_Group3','major'],
  ['2025-04-23','2025-04-23','Major2_2025_LCQ','major'],
  ['2025-04-24','2025-04-24','Major2_2025_LCLobby','major'],
  ['2025-04-26','2025-04-27','Major2_2025_Final','major'],

  // Major 3, Chapter 6 Season 3 (S36) — the last road to Lyon.
  ['2025-07-16','2025-07-17','Major3_2025_PlayIn','major'],
  ['2025-07-20','2025-07-20','Major3_2025_Group1','major'],
  ['2025-07-26','2025-07-26','Major3_2025_Group2','major'],
  ['2025-07-27','2025-07-27','Major3_2025_Group3','major'],
  ['2025-07-30','2025-07-30','Major3_2025_LCQ','major'],
  ['2025-07-31','2025-07-31','Major3_2025_LCLobby','major'],
  ['2025-08-02','2025-08-03','Major3_2025_Final','major'],

  // Lyon, LDLC Arena, 6-7 September 2025. Thirty-three trios, twelve matches
  // over two days on one cumulative leaderboard — the Antwerp shape, and the
  // reason the 2026 row is played on its Saturday is the reason this one is.
  // Eleven of the thirty-three seats are Europe's; there is no Last Chance into
  // it, so the three Majors' Finals leaderboards fill the plane on their own.
  ['2025-09-06','2025-09-07','GlobalChampionship2025','globals']
];
/* The 2025 divisional cups, week by week: [id, session 1, session 2, Weekly Final].

   Five weeks in each of the first two seasons and two in the third — twelve cup
   weeks against 2026's seventeen, because Chapter 6 Season 3 was short. The
   rhythm is the Wednesday and the Thursday with the Final on the Saturday, where
   2026 runs Monday and Tuesday — but only ten of the twelve: week 2 of Season 1
   and week 1 of Season 3 open on the Tuesday instead, and are written here as
   they ran rather than as the pattern says they should have. Ten matches a
   session throughout; the Final is six matches in the first two seasons and
   seven in the third, which is Epic's own MatchCap and not a rounding of it. */
/* Дивизионные кубки C4S1 (январь — февраль 2023): Elite, Contender, Challenger — три ступени
   в любом регионе. Недели Elite (Tracker, S23_DivisionalCups_Elite): среда и пятница, финал
   Elite в субботу; Contender и Challenger играют в те же вечера. После 25 февраля дивизионов
   нет (ccNoDivisions). Placement Cup 15–16 декабря не играется: ступень выбирается при создании. */
const CC_CUP_WEEKS_2023=[
  ['S23_DivisionalCups','2023-01-04','2023-01-06','2023-01-07'],
  ['S23_DivisionalCups','2023-01-11','2023-01-13','2023-01-14'],
  ['S23_DivisionalCups','2023-01-18','2023-01-20','2023-01-21'],
  ['S23_DivisionalCups','2023-01-25','2023-01-27','2023-01-28'],
  ['S23_DivisionalCups','2023-02-22','2023-02-24','2023-02-25']
];
// Последний день, когда в 2023-м есть дивизионы: финал Мейджора 1 (туда пускали только Elite).
const CC_DIV_END_2023='2023-03-05';
const CC_CUP_WEEKS_2025=[
  ['S33_FNCSDivisionalCup','2024-12-11','2024-12-12','2024-12-14'],
  ['S33_FNCSDivisionalCup','2024-12-17','2024-12-19','2024-12-21'],
  ['S33_FNCSDivisionalCup','2025-01-08','2025-01-09','2025-01-11'],
  ['S33_FNCSDivisionalCup','2025-01-15','2025-01-16','2025-01-18'],
  ['S33_FNCSDivisionalCup','2025-01-22','2025-01-23','2025-01-25'],
  ['S34_FNCSDivisionalCup','2025-03-05','2025-03-06','2025-03-08'],
  ['S34_FNCSDivisionalCup','2025-03-12','2025-03-13','2025-03-15'],
  ['S34_FNCSDivisionalCup','2025-03-19','2025-03-20','2025-03-22'],
  // The make-good Monday. See the note above the calendar.
  ['S34_FNCSDivisionalCup','2025-03-26','2025-03-27','2025-03-31'],
  ['S34_FNCSDivisionalCup','2025-04-02','2025-04-03','2025-04-05'],
  ['S36_FNCSDivisionalCup','2025-06-17','2025-06-19','2025-06-21'],
  ['S36_FNCSDivisionalCup','2025-06-25','2025-06-26','2025-06-28']
];
/* What a stage of this year is worth playing, in the shape CC_MAJOR_STAGE uses.

   Epic's own MatchCap per window, and the cuts off the tournament's published
   format. Trios, so the room is a third smaller in teams than a duo year at the
   same head count — which is the one number a career mode has to get right
   before anything else about a trio season is worth building. */
const CC_MAJOR_STAGE_2025={
  playin  :{games:10, days:2, cut:99},   // cumulative over both days, top 99 EU
  /* Ten a group: five Victory Royales and five more on points. The cut counts
     the winners inside it — a group win is 944 points (majorHeatPoints), so the
     top of the table IS the winners. At cut 5 the five winners took every seat,
     nobody came through on points, and the groups sent 15 to a 33-trio final
     (tester, 5 Oct: «проходят только те, кто выиграл игру… в финалах всего 17»).
     3 × 10 = 30 is what majorFormat measured for t1–t3, + 3 Lobby winners = 33. */
  group   :{games:5,  cut:10},
  lcq     :{games:10, cut:33},
  lclobby :{games:3,  cut:0},            // a Victory Royale is the ticket
  final   :{games:6,  days:2, cut:0}
};
const CC_CUP_2025={games:10, finalGames:6, finalGamesS36:7};
/* Bounds of 2026 (CC_YEAR_FROM / CC_YEAR_TO). Still missing for a trio season:
   a third seat (everything from careerPartnerCard on assumes a pair: LAN duo lock, chemistry,
   poaching, inbox seat top-up); the Group Stage draw (one of three days, 2026 Heats are a block);
   no Reload, Summit or Globals LCQ, so the calendar strip has to show the gap.
   Cards exist: CARD_SET t1–t3 are the three Majors, GC2025_PRIZES is Lyon ($2,001,000, 33 places). */
// До 29.11: после Лиона — капы Главы 6 октября и сезон Симпсонов (C6 мини-сезон, 1–29 ноября 2025: Duos и Squads
// Victory Cup, Reload Quick Cup из архива Epic). 2026-й начинается 1 декабря.
const CC_YEAR_2025_FROM='2024-12-07', CC_YEAR_2025_TO='2025-11-29';   // + Кубок наций после Лиона
// ==== FNCS 2019 cal (tools/splice-2019.js) ====
/* ---- 2019 в карьере --------------------------------------------------------------
   Формат меняется по ходу года: World Cup (недели Online Open — соло по нечётным, дуо по
   чётным; финалы в Нью-Йорке 27–28 июля), FNCS Season X (трио, август — сентябрь), FNCS
   Chapter 2 Season 1 (сквады, октябрь — декабрь). Состав года — сквад; вечер — в своём
   формате (см. runCareerMajorMX). Даты и квоты — окна Epic с Tracker
   (tools/measured/tracker-2019.json), финалы Нью-Йорка — Liquipedia; спека —
   docs/superpowers/specs/2026-09-27-career-year-2019-2020-design.md. */
// Год начинается 1 марта (его слово 29.09: «2019 может с марта начать, мало турниров до этого»); было 21 января.
const CC_YEAR_2019_FROM='2019-03-01', CC_YEAR_2019_TO='2019-12-29';
const CAREER_YEAR_2019=[
  // World Cup Solo («Мейджор 1»): суббота — открытый раунд, воскресенье — финал недели (3000).
  ['2019-04-13','2019-04-13','Major1_2019_W1R1','major'], ['2019-04-14','2019-04-14','Major1_2019_W1R2','major'],
  ['2019-04-20','2019-04-20','Major2_2019_W2R1','major'], ['2019-04-21','2019-04-21','Major2_2019_W2R2','major'],
  ['2019-04-27','2019-04-27','Major1_2019_W3R1','major'], ['2019-04-28','2019-04-28','Major1_2019_W3R2','major'],
  ['2019-05-04','2019-05-04','Major2_2019_W4R1','major'], ['2019-05-05','2019-05-05','Major2_2019_W4R2','major'],
  ['2019-05-11','2019-05-11','Major1_2019_W5R1','major'], ['2019-05-12','2019-05-12','Major1_2019_W5R2','major'],
  ['2019-05-18','2019-05-18','Major2_2019_W6R1','major'], ['2019-05-19','2019-05-19','Major2_2019_W6R2','major'],
  ['2019-05-25','2019-05-25','Major1_2019_W7R1','major'], ['2019-05-26','2019-05-26','Major1_2019_W7R2','major'],
  ['2019-06-01','2019-06-01','Major2_2019_W8R1','major'], ['2019-06-02','2019-06-02','Major2_2019_W8R2','major'],
  ['2019-06-08','2019-06-08','Major1_2019_W9R1','major'], ['2019-06-09','2019-06-09','Major1_2019_W9R2','major'],
  ['2019-06-20','2019-06-20','Major2_2019_W10R1','major'], ['2019-06-21','2019-06-21','Major2_2019_W10R2','major'],
  // Финалы World Cup, Arthur Ashe Stadium: дуо 27 июля, соло 28 июля.
  ['2019-07-27','2019-07-27','Major2_2019_Final','major'],
  ['2019-07-28','2019-07-28','Major1_2019_Final','major'],
  // FNCS Season X («Мейджор 3», трио): суббота — раунды 1 и 2, воскресенье — финал недели.
  ['2019-08-17','2019-08-17','Major3_2019_W1R12','major'], ['2019-08-18','2019-08-18','Major3_2019_W1R3','major'],
  ['2019-08-24','2019-08-24','Major3_2019_W2R12','major'], ['2019-08-25','2019-08-25','Major3_2019_W2R3','major'],
  ['2019-08-31','2019-08-31','Major3_2019_W3R12','major'], ['2019-09-01','2019-09-01','Major3_2019_W3R3','major'],
  ['2019-09-07','2019-09-07','Major3_2019_W4R12','major'], ['2019-09-08','2019-09-08','Major3_2019_W4R3','major'],
  ['2019-09-14','2019-09-14','Major3_2019_W5R12','major'], ['2019-09-15','2019-09-15','Major3_2019_W5R3','major'],
  ['2019-09-20','2019-09-20','Major3_2019_Heat1','major'], ['2019-09-21','2019-09-21','Major3_2019_Heat2','major'],
  ['2019-09-22','2019-09-22','Major3_2019_Final','major'],
  // FNCS Chapter 2 Season 1 («Мейджор 4», сквады): разминка (неделя 0) и четыре недели.
  ['2019-10-26','2019-10-26','Major4_2019_W0R12','major'], ['2019-10-27','2019-10-27','Major4_2019_W0R3','major'],
  ['2019-11-02','2019-11-02','Major4_2019_W1R1','major'], ['2019-11-03','2019-11-03','Major4_2019_W1R23','major'],
  ['2019-11-09','2019-11-09','Major4_2019_W2R12','major'], ['2019-11-10','2019-11-10','Major4_2019_W2R3','major'],
  ['2019-11-16','2019-11-16','Major4_2019_W3R12','major'], ['2019-11-17','2019-11-17','Major4_2019_W3R3','major'],
  ['2019-11-23','2019-11-23','Major4_2019_W4R12','major'], ['2019-11-24','2019-11-24','Major4_2019_W4R3','major'],
  ['2019-12-06','2019-12-06','Major4_2019_Heat1','major'], ['2019-12-07','2019-12-07','Major4_2019_Heat2','major'],
  ['2019-12-08','2019-12-08','Major4_2019_Final','major'],
  // Кубок наций — после FNCS C2S1 (выдумка режима, см. ccNationsBook).
  ['2019-12-14','2019-12-14','NationsTrial','nations'],
  ['2019-12-21','2019-12-21','NationsQual','nations'],
  ['2019-12-28','2019-12-28','NationsFinal','nations']
];
const CC_SEASONS_2019=[
  {id:'S8', from:'2019-02-28', to:'2019-05-08'},
  {id:'S9', from:'2019-05-09', to:'2019-07-31'},
  {id:'S10', from:'2019-08-01', to:'2019-10-12'},
  {id:'S11', from:'2019-10-13', to:'2019-12-31'}
];
CAREER_YEAR_2019.forEach(r=>{
  const m=/^Major(\d)_2019_/.exec(r[2]);
  // World Cup (Solo и Duos) — ключевой арт World Cup, как у квалов турнира; FNCS — остров сезона.
  if(m && !CAREER_EV_ART_ID[r[2]]) CAREER_EV_ART_ID[r[2]]=(m[1]==='1' || m[1]==='2') ? 'art/fncs-2019.jpg' : 'art/map-h'+m[1]+'.jpg';
});
const CC_SNAPSHOTS_2019=[
  /* По сезону (с его первого дня): составы — того FNCS, что шёл в этом сезоне. Соло-сезоны
     держат пары соседнего командного, C3S4 без онлайн-FNCS — C3S3. См. ccSnapshotNow. */
  {tag:'h1', from:CC_YEAR_2019_FROM, playIn:/2019 World Cup (Solo|Duos) . Grand Finals/, lcq:/2019 World Cup (Solo|Duos) . (Semi-Finals|Qualifier|Online Open|Week Finals|Week Qualifier)/},
  {tag:'h3', from:'2019-08-01', playIn:/2019 Season X . Grand Finals/, lcq:/2019 Season X . (Semi-Finals|Qualifier|Online Open|Week Finals|Week Qualifier)/},
  {tag:'h4', from:'2019-10-13', playIn:/2019 C2S1 . Grand Finals/, lcq:/2019 C2S1 . (Semi-Finals|Qualifier|Online Open|Week Finals|Week Qualifier)/}
];
/* Сезоны 2019-го для машины runCareerMajorMX. rounds — раунды недели по порядку (open — зал
   из лестницы, без записи); у World Cup последний раунд — финал недели, верх по квоте региона
   (WC2019_QUOTA) едет в Нью-Йорк. heats — хиты финальной недели: день и квота. Число игр в
   раундах — своя оценка режима (в окнах Epic его нет). */
var CC_MX_SPEC=CC_MX_SPEC||{};
CC_MX_SPEC[2019]={
  1:{set:'h1', name:'World Cup Solo', size:1, kind:'wc', weeks:[1,3,5,7,9],
     rounds:[{games:10, cut:3000, open:true}, {games:10, cut:0, open:true}], finalGames:6, island:'h1'},
  2:{set:'h2', name:'World Cup Duos', size:2, kind:'wc', weeks:[2,4,6,8,10],
     rounds:[{games:10, cut:1500, open:true}, {games:10, cut:0, open:true}], finalGames:6, island:'h1'},
  3:{set:'h3', name:'FNCS Season X', size:3, weeks:[1,2,3,4,5],
     rounds:[{games:10, cut:1000, open:true}, {games:10, cut:150, open:true}, {games:10, cut:0}],   // Liquipedia: Semifinals и Week Finals — «10 match limit» (сверка 7.10)
     heats:[{day:1, cut:8}, {day:2, cut:8}, {day:2, cut:8}, {day:2, cut:8}], heatGames:6, finalGames:6, island:'h3'},
  4:{set:'h4', name:'FNCS Chapter 2 Season 1', size:4, weeks:[0,1,2,3,4],
     rounds:[{games:10, cut:500, open:true}, {games:10, cut:25, open:true}, {games:6, cut:0}],    // Semifinals — «10 match limit», Week Finals — 6
     heats:[{day:1, cut:6}, {day:2, cut:6}, {day:2, cut:6}, {day:2, cut:6}], heatGames:6, finalGames:6, island:'h4'}
};
// Generated by tools/build-2019-cal.js — капы и выплаты 2019-го.
const CC_VICTORY_2019=[
  {day:'2019-08-23',id:'S10_CC_Trios',mode:'trio',n:1,name:'Trios Cash Cup',pay:'S10'},
  {day:'2019-08-30',id:'S10_CC_Trios',mode:'trio',n:2,name:'Trios Cash Cup',pay:'S10'},
  {day:'2019-09-06',id:'S10_CC_Trios',mode:'trio',n:3,name:'Trios Cash Cup',pay:'S10'},
  {day:'2019-09-13',id:'S10_CC_Trios',mode:'trio',n:4,name:'Trios Cash Cup',pay:'S10'}
];
const CC_DCC_PAY_2019={S10:{EU:[[1,6000],[2,5000],[3,4000],[4,2300],[5,1100],[6,900],[7,800],[8,600],[9,500],[10,400],[20,300],[30,200]],NAC:[[1,4000],[2,3300],[3,2500],[4,1335],[5,900],[6,800],[7,600],[8,500],[9,400],[10,300],[20,200]],NAW:[[1,1700],[2,1300],[3,1000],[4,700],[5,500],[6,400],[9,300],[10,200]],BR:[[1,1700],[2,1300],[3,1000],[4,700],[5,500],[6,400],[9,300],[10,200]],ASIA:[[1,1500],[2,900],[3,600],[4,500],[5,400],[6,300],[10,200]],OCE:[[1,1500],[2,900],[3,600],[4,500],[5,400],[6,300],[10,200]]}};
const CC_MX_PAY_2019={3:{EU:[[1,160000],[2,72000],[3,48000],[4,17600],[8,6400],[32,3200]],NAC:[[1,100000],[2,45000],[3,30000],[4,11000],[8,4000],[32,2000]],NAW:[[1,40000],[2,18000],[3,12000],[4,4400],[8,1600],[32,800]],BR:[[1,40000],[2,18000],[3,12000],[4,4400],[8,1600],[32,800]]},4:{EU:[[1,75000],[2,30000],[3,24000],[4,18000],[5,15000],[6,12000],[7,9000],[8,6000],[9,4800],[24,2400]],NAC:[[1,46875],[2,18750],[3,15000],[4,11250],[5,9375],[6,7500],[7,5625],[8,3750],[9,3000],[24,1500]],NAW:[[1,18750],[2,7500],[3,6000],[4,4500],[5,3750],[6,3000],[7,2250],[8,1500],[9,1200],[24,600]],BR:[[1,18750],[2,7500],[3,6000],[4,4500],[5,3750],[6,3000],[7,2250],[8,1500],[9,1200],[24,600]]}};
// ==== /FNCS 2019 cal ====
// ==== FNCS 2020 cal (tools/splice-2020.js) ====
/* ---- 2020 в карьере -----------------------------------------------------------------
   Формат меняется по ходу года: FNCS C2S2 — дуо, C2S3 — соло, C2S4 — трио. Состав года — трио,
   вечер — в своём формате (runCareerMajorMX). Даты — страницы Liquipedia (на Tracker этих
   сезонов нет), квота хита — финал Европы поровну на хиты; генерируется tools/build-2020-cal.js. */
const CC_YEAR_2020_FROM='2020-01-06', CC_YEAR_2020_TO='2020-11-29';
const CAREER_YEAR_2020=[
  ['2020-03-21','2020-03-21','Major1_2020_W1R1','major'],
  ['2020-03-22','2020-03-22','Major1_2020_W1R2','major'],
  ['2020-03-28','2020-03-28','Major1_2020_W2R1','major'],
  ['2020-03-29','2020-03-29','Major1_2020_W2R2','major'],
  ['2020-04-04','2020-04-04','Major1_2020_W3R1','major'],
  ['2020-04-05','2020-04-05','Major1_2020_W3R2','major'],
  ['2020-04-11','2020-04-11','Major1_2020_W4R1','major'],
  ['2020-04-12','2020-04-12','Major1_2020_W4R2','major'],
  ['2020-04-17','2020-04-17','Major1_2020_Heat1','major'],
  ['2020-04-18','2020-04-18','Major1_2020_Heat2','major'],
  ['2020-04-19','2020-04-19','Major1_2020_Final','major'],
  ['2020-08-01','2020-08-01','Major2_2020_W1R12','major'],
  ['2020-08-02','2020-08-02','Major2_2020_W2R12','major'],
  ['2020-08-08','2020-08-08','Major2_2020_W3R12','major'],
  ['2020-08-09','2020-08-09','Major2_2020_W4R12','major'],
  ['2020-08-14','2020-08-14','Major2_2020_Heat1','major'],
  ['2020-08-15','2020-08-15','Major2_2020_Heat2','major'],
  ['2020-08-16','2020-08-16','Major2_2020_Final','major'],
  ['2020-10-09','2020-10-09','Major3_2020_W1R1','major'],
  ['2020-10-11','2020-10-11','Major3_2020_W1R2','major'],
  ['2020-10-16','2020-10-16','Major3_2020_W2R1','major'],
  ['2020-10-18','2020-10-18','Major3_2020_W2R2','major'],
  ['2020-10-23','2020-10-23','Major3_2020_W3R1','major'],
  ['2020-10-25','2020-10-25','Major3_2020_W3R2','major'],
  ['2020-10-29','2020-10-29','Major3_2020_Heat1','major'],
  ['2020-10-31','2020-11-01','Major3_2020_Final','major'],
  ['2020-11-08','2020-11-08','NationsTrial','nations'], ['2020-11-15','2020-11-15','NationsQual','nations'], ['2020-11-22','2020-11-22','NationsFinal','nations']
];
const CC_SEASONS_2020=[{id:'S11', from:'2019-10-15', to:'2020-02-19'}, {id:'S12', from:'2020-02-20', to:'2020-06-16'}, {id:'S13', from:'2020-06-17', to:'2020-08-26'}, {id:'S14', from:'2020-08-27', to:'2020-12-01'}];
CAREER_YEAR_2020.forEach(r=>{ const m=/^Major(\d)_2020_/.exec(r[2]); if(m && !CAREER_EV_ART_ID[r[2]]) CAREER_EV_ART_ID[r[2]]='art/map-i'+m[1]+'.jpg'; });
const CC_SNAPSHOTS_2020=[
  /* По сезону (с его первого дня): составы — того FNCS, что шёл в этом сезоне. Соло-сезоны
     держат пары соседнего командного, C3S4 без онлайн-FNCS — C3S3. См. ccSnapshotNow. */
  {tag:'i0', from:CC_YEAR_2020_FROM, playIn:/2019 C2S1 . Grand Finals/, lcq:/2019 C2S1 . (Semi-Finals|Qualifier|Online Open|Week Finals|Week Qualifier)/, yr:2019},
  {tag:'i1', from:'2020-02-20', playIn:/2020 C2S2 . Grand Finals/, lcq:/2020 C2S2 . (Semi-Finals|Qualifier|Online Open|Week Finals|Week Qualifier)/},
  {tag:'i3', from:'2020-08-27', playIn:/2020 C2S4 . Grand Finals/, lcq:/2020 C2S4 . (Semi-Finals|Qualifier|Online Open|Week Finals|Week Qualifier)/}
];
var CC_MX_SPEC=CC_MX_SPEC||{};
CC_MX_SPEC[2020]={1:{set:'i1',name:'FNCS Chapter 2 Season 2',size:2,qual:false,weeks:[1,2,3,4],rounds:[{games:10,cut:50,open:true},{games:6,cut:0}],heats:[{day:1,cut:12},{day:1,cut:12},{day:2,cut:12},{day:2,cut:12}],heatGames:6,finalGames:12,island:'i1'},2:{set:'i2',name:'FNCS Chapter 2 Season 3',size:1,qual:true,weeks:[1,2,3,4],rounds:[{games:10,cut:100,open:true},{games:6,cut:0}],heats:[{day:1,cut:25},{day:1,cut:25},{day:2,cut:25},{day:2,cut:25}],heatGames:6,finalGames:12,island:'i2'},3:{set:'i3',name:'FNCS Chapter 2 Season 4',size:3,qual:false,weeks:[1,2,3],rounds:[{games:10,cut:33,open:true},{games:6,cut:0}],heats:[{day:1,cut:8},{day:1,cut:8},{day:1,cut:8},{day:1,cut:8}],heatGames:6,finalGames:12,island:'i3'}};
// ==== /FNCS 2020 cal ====
/* WILDCARD C2S4 (Liquipedia «Fortnite Champion Series/Chapter 2/Season 4/Wildcard/<регион>», окна Epic
   S14_FNCS_Finals_*_Wildcard_Event1): 31 октября в 17:00, за 45 минут до Гранд-финала, — один матч. Играют
   9–16-е места каждого из четырёх хитов (32 команды; хит-призы Epic за 9–16 нулевые именно поэтому),
   победитель — 33-я команда Гранд-финала. Призы на игрока: EU $1800 и NAE $1200 на команду за 2–32-е,
   остальные регионы — ноль. Вне генератора build-2020-cal.js, чтобы пересборка календаря это не стёрла. */
/* Сверка с правилами Liquipedia 7.10 (тоже вне генератора): Гранд-финалы C2S2 и C2S3 — «6 match limit»
   (окно Epic S12_FNCS_Finals_PC тоже 6), квалы C2S3 — «Round 1/2: 7 match limit»; финал недели C2S4 —
   Round 3 «(Day 1) 6 match limit … (Day 2) 6 match limit, Top 15 after both days», хиты C2S4 — два дня
   по 6 («Top 8 teams after both days»). Двухдневное здесь играется одним вечером на сумму игр, как финалы. */
if(CC_MX_SPEC[2020]){
  if(CC_MX_SPEC[2020][1]){ CC_MX_SPEC[2020][1].finalGames=6; CC_MX_SPEC[2020][1].finalN=48; }   // финал Европы C2S2 — 48 дуо (Liquipedia, сверка 20.10; было 50 — добор из серии до лобби)
  if(CC_MX_SPEC[2020][2]){ CC_MX_SPEC[2020][2].finalGames=6; CC_MX_SPEC[2020][2].rounds[0].games=7; }
  if(CC_MX_SPEC[2020][3]){ CC_MX_SPEC[2020][3].rounds[1].games=12; CC_MX_SPEC[2020][3].heatGames=12; }
}
if(CC_MX_SPEC[2020] && CC_MX_SPEC[2020][3]) CC_MX_SPEC[2020][3].wild={from:9, to:16, games:1,
  pay:{EU:[[1,0],[32,600]], NAC:[[1,0],[32,400]]}};
function ccMXWildRows(m, sp){
  ccMXSettleHeats(m);
  const n=sp.wild.to-sp.wild.from+1, out=[];
  ccMXHeats(m).forEach((h,i)=>((m.heatRes[i]||{}).rest||[]).slice(0, n).forEach(r=>{ if(r!=='you') out.push(r); }));
  return out;
}
// Победитель Wildcard без тебя — один матч движком, раз на сезон (m.wildRes). Пока ты сам в Wildcard и не сыграл его — никого.
function ccMXWildWinner(m, sp){
  if(m.wildRes) return m.wildRes.win;
  if(m.wild) return null;
  const rows=ccMXWildRows(m, sp);
  if(!rows.length) return null;
  let win=null;
  ccWithEventSize(sp.size, ()=>{
    const room=rows.map(ccMajorTeamFrom);
    room.forEach(t=>{ t.stagePts=0; t.wins=0; t.stageElims=0; });
    ccWorldRun('mxw|'+m.season+'|'+m.y+'|'+m.n, ()=>simulateGames(room, sp.wild.games, ccM24Points, CC_M24_KILL));
    win=ccMajorSeatRow(ccM24Rank(room)[0]);
  });
  m.wildRes={win};
  return win;
}
function ccMXWildPrize(sp){
  const t=(sp.wild.pay||{})[careerPrizeRegion()];
  // Таблица на игрока, как хиты 2020-го (ccMXHeatPrize), — функция отдаёт сумму на команду.
  // Без таблицы региона — ноль (NAW/BR/OCE/ASIA/ME Wildcard не платили), а не европейская, как в ccPay24.
  return t ? (place=>{ const row=t.find(x=>place<=x[0]); return (row ? row[1] : 0)*sp.size; }) : null;
}
// ==== FNCS 2021 cal (tools/splice-2021.js) ====
/* ---- FNCS 2021 в карьере ------------------------------------------------------
   Трио весь год, Chapter 2 (сезоны 5–8), ЛАНов нет. Даты и квоты — окна Epic с архива
   Tracker (tools/measured/tracker-2021.json), места финалов NA — Liquipedia (liqui-2021/);
   спека — docs/superpowers/specs/2026-09-27-career-year-2021-design.md.

   Четыре сезона FNCS (C2S5–C2S8) — «Мейджоры» карьеры: квалификаторы по четыре раунда →
   полуфинал хитами → Reboot Round → Гранд-финал. «Мейджор 5» — FNCS Grand Royale, финал
   20–21 ноября. См. runCareerMajor2021. */
const CC_YEAR_2021_FROM='2020-12-07', CC_YEAR_2021_TO='2021-12-05';   // + Кубок наций после Grand Royale
const CAREER_YEAR_2021=[
  // Мейджор 1 (C2S5): три квалификатора — пятница раунд 1, суббота 2 и 3, воскресенье 4.
  ['2021-02-12','2021-02-12','Major1_2021_Q1R1','major'],
  ['2021-02-13','2021-02-13','Major1_2021_Q1R23','major'],
  ['2021-02-14','2021-02-14','Major1_2021_Q1R4','major'],
  ['2021-02-19','2021-02-19','Major1_2021_Q2R1','major'],
  ['2021-02-20','2021-02-20','Major1_2021_Q2R23','major'],
  ['2021-02-21','2021-02-21','Major1_2021_Q2R4','major'],
  ['2021-02-26','2021-02-26','Major1_2021_Q3R1','major'],
  ['2021-02-27','2021-02-27','Major1_2021_Q3R23','major'],
  ['2021-02-28','2021-02-28','Major1_2021_Q3R4','major'],
  ['2021-03-06','2021-03-06','Major1_2021_Semi1','major'],
  ['2021-03-07','2021-03-07','Major1_2021_Semi2','major'],
  ['2021-03-08','2021-03-08','Major1_2021_Reboot','major'],
  ['2021-03-13','2021-03-14','Major1_2021_Final','major'],
  // Мейджор 2 (C2S6).
  ['2021-04-23','2021-04-23','Major2_2021_Q1R1','major'],
  ['2021-04-24','2021-04-24','Major2_2021_Q1R23','major'],
  ['2021-04-25','2021-04-25','Major2_2021_Q1R4','major'],
  ['2021-04-30','2021-04-30','Major2_2021_Q2R1','major'],
  ['2021-05-01','2021-05-01','Major2_2021_Q2R23','major'],
  ['2021-05-02','2021-05-02','Major2_2021_Q2R4','major'],
  ['2021-05-07','2021-05-07','Major2_2021_Q3R1','major'],
  ['2021-05-08','2021-05-08','Major2_2021_Q3R23','major'],
  ['2021-05-09','2021-05-09','Major2_2021_Q3R4','major'],
  ['2021-05-22','2021-05-22','Major2_2021_Semi1','major'],
  ['2021-05-23','2021-05-23','Major2_2021_Reboot','major'],
  ['2021-05-29','2021-05-30','Major2_2021_Final','major'],
  // Мейджор 3 (C2S7).
  ['2021-07-30','2021-07-30','Major3_2021_Q1R1','major'],
  ['2021-07-31','2021-07-31','Major3_2021_Q1R23','major'],
  ['2021-08-01','2021-08-01','Major3_2021_Q1R4','major'],
  ['2021-08-13','2021-08-13','Major3_2021_Q2R1','major'],
  ['2021-08-14','2021-08-14','Major3_2021_Q2R23','major'],
  ['2021-08-15','2021-08-15','Major3_2021_Q2R4','major'],
  ['2021-08-20','2021-08-20','Major3_2021_Q3R1','major'],
  ['2021-08-21','2021-08-21','Major3_2021_Q3R23','major'],
  ['2021-08-22','2021-08-22','Major3_2021_Q3R4','major'],
  ['2021-08-28','2021-08-28','Major3_2021_Semi1','major'],
  ['2021-08-29','2021-08-29','Major3_2021_Reboot','major'],
  ['2021-09-04','2021-09-05','Major3_2021_Final','major'],
  // Мейджор 4 (C2S8): два квалификатора, полуфинал в два дня, без Reboot Round.
  ['2021-10-15','2021-10-15','Major4_2021_Q1R12','major'],
  ['2021-10-16','2021-10-16','Major4_2021_Q1R3','major'],
  ['2021-10-17','2021-10-17','Major4_2021_Q1R4','major'],
  ['2021-10-22','2021-10-22','Major4_2021_Q2R12','major'],
  ['2021-10-23','2021-10-23','Major4_2021_Q2R3','major'],
  ['2021-10-24','2021-10-24','Major4_2021_Q2R4','major'],
  ['2021-10-28','2021-10-28','Major4_2021_Semi1','major'],
  ['2021-10-29','2021-10-29','Major4_2021_Semi2','major'],
  ['2021-10-30','2021-10-31','Major4_2021_Final','major'],
  // FNCS Grand Royale — финал 20–21 ноября («Мейджор 5»), онлайн по регионам.
  ['2021-11-20','2021-11-21','Major5_2021_Final','major'],
  // Кубок наций — после Grand Royale (выдумка режима, см. ccNationsBook).
  ['2021-11-27','2021-11-27','NationsTrial','nations'],
  ['2021-12-01','2021-12-01','NationsQual','nations'],
  ['2021-12-04','2021-12-04','NationsFinal','nations']
];
// Сезоны 2021-го — Chapter 2 (S15–S18), границы по патчам.
const CC_SEASONS_2021=[
  {id:'S15', from:'2020-12-02', to:'2021-03-15'},
  {id:'S16', from:'2021-03-16', to:'2021-06-07'},
  {id:'S17', from:'2021-06-08', to:'2021-09-12'},
  {id:'S18', from:'2021-09-13', to:'2021-12-04'}
];
// Обложки дней 2021-го — остров своего сезона (Мейджор n — j<n>, Grand Royale — j4).
CAREER_YEAR_2021.forEach(r=>{
  const m=/^Major(\d)_2021_/.exec(r[2]);
  if(m && !CAREER_EV_ART_ID[r[2]]) CAREER_EV_ART_ID[r[2]]='art/map-j'+Math.min(+m[1], 4)+'.jpg';
});
// Одна книга трио на год: трио Гранд-финалов и полуфиналов четырёх сезонов (j1–j4).
const CC_SNAPSHOTS_2021=[
  /* По сезону (с его первого дня): составы — того FNCS, что шёл в этом сезоне. Соло-сезоны
     держат пары соседнего командного, C3S4 без онлайн-FNCS — C3S3. См. ccSnapshotNow. */
  {tag:'j1', from:CC_YEAR_2021_FROM, playIn:/2021 C2S5 . Grand Finals/, lcq:/2021 C2S5 . (Semi-Finals|Qualifier|Online Open|Week Finals|Week Qualifier)/},
  {tag:'j2', from:'2021-03-16', playIn:/2021 C2S6 . Grand Finals/, lcq:/2021 C2S6 . (Semi-Finals|Qualifier|Online Open|Week Finals|Week Qualifier)/},
  {tag:'j3', from:'2021-06-08', playIn:/2021 C2S7 . Grand Finals/, lcq:/2021 C2S7 . (Semi-Finals|Qualifier|Online Open|Week Finals|Week Qualifier)/},
  {tag:'j4', from:'2021-09-13', playIn:/2021 C2S8 . Grand Finals/, lcq:/2021 C2S8 . (Semi-Finals|Qualifier|Online Open|Week Finals|Week Qualifier)/}
];
// Generated by tools/build-2021-cal.js — капы, выплаты и Grand Royale FNCS 2021.
const CC_VICTORY_2021=[
  {day:'2021-01-11',id:'S15_CashCup',mode:'trio',n:1,name:'Trios Cash Cup',pay:'S15'},
  {day:'2021-01-25',id:'S15_CashCup',mode:'trio',n:2,name:'Trios Cash Cup',pay:'S15'},
  {day:'2021-01-30',id:'S15_SoloCashCup',mode:'solo',n:1,name:'Solo Cash Cup',pay:'S15SOLO'},
  {day:'2021-02-01',id:'S15_CashCup',mode:'trio',n:3,name:'Trios Cash Cup',pay:'S15'},
  {day:'2021-02-06',id:'S15_SoloCashCup',mode:'solo',n:2,name:'Solo Cash Cup',pay:'S15SOLO'},
  {day:'2021-02-08',id:'S15_CashCup',mode:'trio',n:4,name:'Trios Cash Cup',pay:'S15'},
  {day:'2021-02-15',id:'S15_CashCup',mode:'trio',n:5,name:'Trios Cash Cup',pay:'S15'},
  {day:'2021-03-01',id:'S15_CashCup',mode:'trio',n:6,name:'Trios Cash Cup',pay:'S15'},
  {day:'2021-04-03',id:'S16_SoloCashCup',mode:'solo',n:1,name:'Solo Cash Cup',pay:'S16SOLO'},
  {day:'2021-04-10',id:'S16_SoloCashCup',mode:'solo',n:2,name:'Solo Cash Cup',pay:'S16SOLO'},
  {day:'2021-04-12',id:'S16_CashCup',mode:'trio',n:1,name:'Trios Cash Cup',pay:'S16'},
  {day:'2021-04-17',id:'S16_SoloCashCup',mode:'solo',n:3,name:'Solo Cash Cup',pay:'S16SOLO'},
  {day:'2021-04-19',id:'S16_CashCup',mode:'trio',n:2,name:'Trios Cash Cup',pay:'S16'},
  {day:'2021-04-26',id:'S16_CashCup',mode:'trio',n:3,name:'Trios Cash Cup',pay:'S16'},
  {day:'2021-05-03',id:'S16_CashCup',mode:'trio',n:4,name:'Trios Cash Cup',pay:'S16'},
  {day:'2021-05-10',id:'S16_CashCup',mode:'trio',n:5,name:'Trios Cash Cup',pay:'S16'},
  {day:'2021-05-16',id:'S16_SoloCashCup',mode:'solo',n:4,name:'Solo Cash Cup',pay:'S16SOLO'},
  {day:'2021-05-17',id:'S16_CashCup',mode:'trio',n:6,name:'Trios Cash Cup',pay:'S16'},
  {day:'2021-05-24',id:'S16_CashCup',mode:'trio',n:7,name:'Trios Cash Cup',pay:'S16'},
  {day:'2021-07-13',id:'S17_CashCup',mode:'trio',n:1,name:'Trios Cash Cup',pay:'S17'},
  {day:'2021-07-18',id:'S17_SoloCashCup',mode:'solo',n:1,name:'Solo Cash Cup',pay:'S17SOLO'},
  {day:'2021-07-19',id:'S17_CashCup',mode:'trio',n:2,name:'Trios Cash Cup',pay:'S17'},
  {day:'2021-07-25',id:'S17_SoloCashCup',mode:'solo',n:2,name:'Solo Cash Cup',pay:'S17SOLO'},
  {day:'2021-07-26',id:'S17_CashCup',mode:'trio',n:3,name:'Trios Cash Cup',pay:'S17'},
  {day:'2021-08-02',id:'S17_CashCup',mode:'trio',n:4,name:'Trios Cash Cup',pay:'S17'},
  {day:'2021-08-04',id:'S17_SoloCashCup',mode:'solo',n:3,name:'Solo Cash Cup',pay:'S17SOLO'},
  {day:'2021-08-09',id:'S17_CashCup',mode:'trio',n:5,name:'Trios Cash Cup',pay:'S17'},
  {day:'2021-08-16',id:'S17_CashCup',mode:'trio',n:6,name:'Trios Cash Cup',pay:'S17'},
  {day:'2021-08-23',id:'S17_CashCup',mode:'trio',n:7,name:'Trios Cash Cup',pay:'S17'},
  {day:'2021-08-30',id:'S17_CashCup',mode:'trio',n:8,name:'Trios Cash Cup',pay:'S17'},
  {day:'2021-10-03',id:'S18_SoloCashCup',mode:'solo',n:1,name:'Solo Cash Cup',pay:'S18SOLO'},
  {day:'2021-10-04',id:'S18_CashCup',mode:'trio',n:1,name:'Trios Cash Cup',pay:'S18'},
  {day:'2021-10-10',id:'S18_SoloCashCup',mode:'solo',n:2,name:'Solo Cash Cup',pay:'S18SOLO'},
  {day:'2021-10-11',id:'S18_CashCup',mode:'trio',n:2,name:'Trios Cash Cup',pay:'S18'},
  {day:'2021-10-18',id:'S18_CashCup',mode:'trio',n:3,name:'Trios Cash Cup',pay:'S18'},
  {day:'2021-10-25',id:'S18_CashCup',mode:'trio',n:4,name:'Trios Cash Cup',pay:'S18'},
  {day:'2021-11-01',id:'S18_CashCup',mode:'trio',n:5,name:'Trios Cash Cup',pay:'S18'},
  {day:'2021-11-07',id:'S18_SoloCashCup',mode:'solo',n:3,name:'Solo Cash Cup',pay:'S18SOLO'},
  {day:'2021-11-08',id:'S18_CashCup',mode:'trio',n:6,name:'Trios Cash Cup',pay:'S18'},
  {day:'2021-11-14',id:'S18_SoloCashCup',mode:'solo',n:4,name:'Solo Cash Cup',pay:'S18SOLO'},
  {day:'2021-11-15',id:'S18_CashCup',mode:'trio',n:7,name:'Trios Cash Cup',pay:'S18'},
  {day:'2021-11-22',id:'S18_CashCup',mode:'trio',n:8,name:'Trios Cash Cup',pay:'S18'},
  {day:'2021-11-28',id:'S18_SoloCashCup',mode:'solo',n:5,name:'Solo Cash Cup',pay:'S18SOLO'},
  {day:'2021-11-29',id:'S18_CashCup',mode:'trio',n:9,name:'Trios Cash Cup',pay:'S18'}
];
const CC_DCC_PAY_2021={S15:{EU:[[1,767],[2,600],[3,535],[4,500],[10,400],[15,270],[25,225],[50,200]],NAC:[[1,600],[2,475],[3,435],[4,400],[5,350],[10,270],[20,225],[25,200]],NAW:[[1,400],[2,350],[3,270],[6,250],[12,200]],BR:[[1,400],[2,350],[3,270],[6,250],[12,200]],ASIA:[[1,350],[2,270],[3,250],[6,200]],ME:[[1,300],[2,250],[3,233],[5,200]],OCE:[[1,300],[4,200]]},S15SOLO:{EU:[[1,750],[2,600],[3,535],[4,500],[10,400],[15,270],[25,225],[50,200]],NAC:[[1,600],[2,475],[3,435],[4,400],[5,350],[10,270],[20,225],[25,200]],NAW:[[1,400],[2,350],[3,270],[6,250],[12,200]],BR:[[1,400],[2,350],[3,270],[6,250],[12,200]],ASIA:[[1,350],[2,270],[3,250],[6,200]],ME:[[1,300],[2,250],[3,225],[5,200]],OCE:[[1,300],[4,200]]},S16:{EU:[[1,767],[2,600],[3,535],[4,500],[10,400],[15,270],[25,225],[50,200]],NAC:[[1,600],[2,475],[3,435],[4,400],[5,350],[10,270],[20,225],[25,200]],NAW:[[1,400],[2,350],[3,270],[6,250],[12,200]],BR:[[1,400],[2,350],[3,270],[6,250],[12,200]],ASIA:[[1,350],[2,270],[3,250],[6,200]],ME:[[1,300],[2,250],[3,233],[5,200]],OCE:[[1,300],[4,200]]},S16SOLO:{EU:[[1,750],[2,600],[3,535],[4,500],[10,400],[15,270],[25,225],[50,200]],NAC:[[1,600],[2,475],[3,435],[4,400],[5,350],[10,270],[20,225],[25,200]],NAW:[[1,400],[2,350],[3,270],[6,250],[12,200]],BR:[[1,400],[2,350],[3,270],[6,250],[12,200]],ASIA:[[1,350],[2,270],[3,250],[6,200]],ME:[[1,300],[2,250],[3,225],[5,200]],OCE:[[1,300],[4,200]]},S17:{EU:[[1,767],[2,600],[3,535],[4,500],[10,400],[15,270],[25,225],[50,200]],NAC:[[1,600],[2,475],[3,435],[4,400],[5,350],[10,270],[20,225],[25,200]],NAW:[[1,400],[2,350],[3,270],[5,250],[8,200]],BR:[[1,500],[2,450],[3,400],[4,300],[5,250],[18,200]],ASIA:[[1,350],[2,270],[3,250],[6,200]],ME:[[1,300],[2,250],[3,233],[5,200]],OCE:[[1,300],[4,200]]},S17SOLO:{EU:[[1,750],[2,600],[3,535],[4,500],[10,400],[15,250],[25,225],[55,200]],NAC:[[1,600],[2,475],[3,435],[4,400],[5,350],[10,270],[25,200]],NAW:[[1,400],[2,350],[3,270],[6,250],[8,200]],BR:[[1,450],[2,350],[3,300],[6,250],[18,200]],ASIA:[[1,350],[2,270],[3,250],[6,200]],ME:[[1,300],[2,250],[3,225],[5,200]],OCE:[[1,300],[4,200]]},S18:{EU:[[1,800],[2,600],[3,535],[4,500],[10,400],[15,270],[25,225],[55,200]],NAC:[[1,600],[2,475],[3,435],[4,400],[5,350],[10,300],[23,200]],NAW:[[1,400],[2,350],[3,270],[5,250],[8,200]],BR:[[1,500],[2,450],[3,400],[4,300],[5,250],[18,200]],ASIA:[[1,350],[2,270],[3,250],[6,200]],ME:[[1,300],[2,250],[3,233],[5,200]],OCE:[[1,300],[4,200]]},S18SOLO:{EU:[[1,750],[2,600],[3,535],[4,500],[10,400],[15,250],[25,225],[55,200]],NAC:[[1,600],[2,475],[3,435],[4,400],[5,350],[10,270],[25,200]],NAW:[[1,400],[2,350],[3,270],[6,250],[8,200]],BR:[[1,450],[2,350],[3,300],[6,250],[18,200]],ASIA:[[1,350],[2,270],[3,250],[6,200]],ME:[[1,300],[2,250],[3,225],[5,200]],OCE:[[1,300],[4,200]]}};
const CC_MAJOR_PAY_2021={1:{EU:[[1,100000],[2,70000],[3,45000],[4,40000],[5,35000],[6,30000],[7,25000],[8,20000],[9,15000],[10,10000],[15,5000],[20,3000],[26,2000],[33,1000]],NAC:[[1,50000],[2,35000],[3,23000],[4,20000],[5,18000],[6,15000],[7,13000],[8,10000],[9,8000],[10,5000],[15,3000],[20,1800],[26,1000],[33,600]],NAW:[[1,25000],[2,16000],[3,10000],[4,8000],[5,7000],[6,6000],[7,5000],[8,4000],[9,3000],[10,2000],[15,1000],[20,800],[26,500],[33,300]],BR:[[1,25000],[2,16000],[3,10000],[4,8000],[5,7000],[6,6000],[7,5000],[8,4000],[9,3000],[10,2000],[15,1000],[20,800],[26,500],[33,300]],ASIA:[[1,12000],[2,8000],[3,5000],[4,4000],[5,3500],[6,3000],[7,2500],[8,2000],[9,1500],[10,1000],[15,500],[20,400],[26,300],[33,200]],ME:[[1,10000],[2,6500],[3,4000],[4,3000],[5,2500],[6,2200],[7,1800],[8,1600],[9,1400],[10,800],[15,450],[26,300],[33,200]],OCE:[[1,7500],[2,5000],[3,3000],[4,2100],[5,1800],[6,1500],[7,1300],[8,1100],[9,900],[10,600],[15,300],[20,250],[33,200]]},2:{EU:[[1,100000],[2,70000],[3,45000],[4,40000],[5,35000],[6,30000],[7,25000],[8,20000],[9,15000],[10,10000],[15,5000],[20,3000],[26,2000],[33,1000]],NAC:[[1,50000],[2,35000],[3,23000],[4,20000],[5,18000],[6,15000],[7,13000],[8,10000],[9,8000],[10,5000],[15,3000],[20,1800],[26,1000],[33,600]],NAW:[[1,25000],[2,16000],[3,10000],[4,8000],[5,7000],[6,6000],[7,5000],[8,4000],[9,3000],[10,2000],[15,1000],[20,800],[26,500],[33,300]],BR:[[1,25000],[2,16000],[3,10000],[4,8000],[5,7000],[6,6000],[7,5000],[8,4000],[9,3000],[10,2000],[15,1000],[20,800],[26,500],[33,300]],ASIA:[[1,12000],[2,8000],[3,5000],[4,4000],[5,3500],[6,3000],[7,2500],[8,2000],[9,1500],[10,1000],[15,500],[20,400],[26,300],[33,200]],ME:[[1,10000],[2,6500],[3,4000],[4,3000],[5,2500],[6,2200],[7,1800],[8,1600],[9,1400],[10,800],[15,450],[26,300],[33,200]],OCE:[[1,7500],[2,5000],[3,3000],[4,2100],[5,1800],[6,1500],[7,1300],[8,1100],[9,900],[10,600],[15,300],[20,250],[33,200]]},3:{EU:[[1,100000],[2,70000],[3,45000],[4,40000],[5,35000],[6,30000],[7,25000],[8,20000],[9,15000],[10,10000],[15,5000],[20,3000],[26,2000],[33,1200]],NAC:[[1,45000],[2,35000],[3,23000],[4,20000],[5,18000],[6,15000],[7,13000],[8,8000],[9,5000],[10,3500],[15,2300],[20,1400],[26,700],[33,500]],NAW:[[1,16000],[2,11500],[3,8000],[4,7000],[5,5000],[6,3500],[7,3000],[8,2500],[9,2000],[10,1500],[15,1000],[20,800],[26,500],[33,300]],BR:[[1,30000],[2,25000],[3,17000],[4,14000],[5,10000],[6,7000],[7,6000],[8,5000],[9,4000],[10,3000],[15,2000],[20,1000],[26,625],[33,425]],ASIA:[[1,12000],[2,8000],[3,5000],[4,4000],[5,3500],[6,3000],[7,2500],[8,2000],[9,1500],[10,1000],[15,500],[20,400],[26,300],[33,200]],ME:[[1,10000],[2,6500],[3,4000],[4,3000],[5,2500],[6,2200],[7,1800],[8,1600],[9,1400],[10,800],[15,450],[26,300],[33,200]],OCE:[[1,7500],[2,5000],[3,3000],[4,2100],[5,1800],[6,1500],[7,1300],[8,1100],[9,900],[10,600],[15,300],[20,250],[33,200]]},4:{EU:[[1,100000],[2,70000],[3,45000],[4,40000],[5,35000],[6,30000],[7,25000],[8,20000],[9,15000],[10,10000],[15,5000],[20,3000],[26,2000],[33,1200]],NAC:[[1,45000],[2,35000],[3,23000],[4,20000],[5,18000],[6,15000],[7,13000],[8,8000],[9,5000],[10,3500],[15,2300],[20,1400],[26,700],[33,500]],NAW:[[1,16000],[2,11500],[3,8000],[4,7000],[5,5000],[6,3500],[7,3000],[8,2500],[9,2000],[10,1500],[15,1000],[20,800],[26,500],[33,300]],BR:[[1,30000],[2,25000],[3,17000],[4,14000],[5,10000],[6,7000],[7,6000],[8,5000],[9,4000],[10,3000],[15,2000],[20,1000],[26,625],[33,425]],ASIA:[[1,12000],[2,8000],[3,5000],[4,4000],[5,3500],[6,3000],[7,2500],[8,2000],[9,1500],[10,1000],[15,500],[20,400],[26,300],[33,200]],ME:[[1,10000],[2,6500],[3,4000],[4,3000],[5,2500],[6,2200],[7,1800],[8,1600],[9,1400],[10,800],[15,450],[26,300],[33,200]],OCE:[[1,7500],[2,5000],[3,3000],[4,2100],[5,1800],[6,1500],[7,1300],[8,1100],[9,900],[10,600],[15,300],[20,250],[33,200]]},5:{EU:[[1,200000],[2,150000],[3,90000],[4,60000],[5,40000],[6,30000],[7,25000],[8,20000],[9,18000],[10,14800],[15,6500],[20,5000],[25,4000],[33,3100]],NAC:[[1,95000],[2,70000],[3,42000],[4,28000],[5,18000],[6,14000],[7,12000],[8,10000],[9,8000],[10,6500],[15,3000],[20,2300],[25,1950],[33,1500]],NAW:[[1,35000],[2,27000],[3,16000],[4,10500],[5,7000],[6,5500],[7,4500],[8,3500],[9,3000],[10,2300],[15,1100],[20,950],[25,800],[33,550]],BR:[[1,60000],[2,47000],[3,28000],[4,19000],[5,12000],[6,9500],[7,8000],[8,6500],[9,5300],[10,4000],[15,2000],[20,1600],[25,1400],[33,1100]],ASIA:[[1,21500],[2,16500],[3,10000],[4,6500],[5,4500],[6,3500],[7,2700],[8,2100],[9,1900],[10,1400],[15,700],[20,600],[26,500],[33,400]],ME:[[1,17000],[2,13333],[3,8000],[4,5000],[5,3500],[6,2800],[7,2300],[8,1700],[9,1500],[10,1100],[15,600],[20,500],[25,400],[33,300]],OCE:[[1,13000],[2,10000],[3,6000],[4,4000],[5,2500],[6,2000],[7,1750],[8,1300],[9,1150],[10,900],[15,500],[20,400],[25,300],[33,250]]}};
const GR2021_TRIOS={"EU":[["Setty","Kami","teeq"],["Queasy","Anas","Th0masHD"],["Hen","TaySon","Chapix"],["Vadeal","JannisZ","Noahreyli"],["Safik","1Lusha","Putrick"],["dyox","Crow VII","100T MrJoseeh"],["Acrian","FuryLegendary","97default"],["Kefyy","pkr","mlodyy771"],["FlowiS","Hellfire","Skram"],["drain gang chief","Shady","Stompy"],["Bloomy","PabloWingu","Swag"],["еtq","Hottie","elokratz"],["FΟRK 381","dzimker","Chico"],["Fastroki","Aqua","rezon ay"],["Endretta","Benjyfishy","MrSavage"],["JOE","Karma","Kylie"],["Floki","Clement","Decyptos"],["Aurerofiez","Poul","Fornax"],["DKS","graye초기","MCES Mirza 愛"],["7aaID gty","Flyy 281","Waiz"],["Andilex","4zr","Xsweeze"],["Skite","Bubak","Ovlder"],["Saevid","Umplify","Matsoe"],["Pinq","Nebs","TruleX"],["TuNa","Mikson","pokimen21"],["Kirb1","banw1se19","69 Minty"],["Merstach","Malibuca","Shizoanmee"],["Skydeun","bitflox ツ","COOKIE SIUUU"],["Kiryache32","Stormyrite","Toose"],["Jules785971","fire228","Art1st "],["Michael ","AstroSMZ","Verox"],["slay kamilek","Jimmy Rozprówacz","Blacha "],["savateschaudtoi","BadSniper","STRAW Force"]],"NAC":[["Dukez","Mero","Bugha"],["Jamper","Deyy","Tragix"],["Slackes","Acorn","Jahq"],["Bucke","Peterbot","MackWood"],["Ceice","Cold","Elitxe"],["Commandment","Cented","Stretch"],["Nittle","Casqer","clarityG"],["Ajerss","Saf","Khanada"],["Degen","Nosh","Eomzo"],["DeRoller","Speguu","Charlie"],["skqttles","Justice","Userz"],["Zlem","Tkay","Chukky"],["PaMstou","wCarey","Fatch"],["Osp","Visxals","Fryst"],["Av","Dmur","Edan"],["Okis","Nani","Dusky"],["Voil","Xccept","Snake"],["Cobolt","Sparkg","Aminished"],["Narwhal","Bully","Tabnae"],["Muz","Joji","Rocaine"],["Nexy","Crackly","Wrigley"],["Mikey","Jays","Smqcked"],["Brycx","Cam","Pdplague"],["Kreo","Knight","RogueShark"],["Shadow","Jayth","Savaje"],["tiekko","Nosn","Gold"],["Blakeps","Scoped","verT"],["Megga","Pxmp","Dubs"],["Dom","Chimp","Ganzo"],["Kn1pher","Doniee","Simple"],["Crumble","Marzz_OW","Bank"],["Mudzi","Mnrr","Yuddn"],["Neeqo","Nounzy","Pxlarized"]],"NAW":[["Arkhram","Reet","EpikWhale"],["poffiee","cyrzr","eclipseNA"],["andyvencha","Criizux","Jelty"],["g0dku","Glace","fecoy"],["Middi","Nico","Chris"],["RichHomieQuinn","WAVE","Kewl"],["Frapai","Blizy","Nate"],["Grim","Yumi","Squishy"],["Rehx","favs","Snacky"],["Kenshi","Maken","Jay"],["Bacca","Nitrix","Kytrex"],["Rexzi","Dynamic","Zehlo"],["Ark","Aiden","Nigel"],["Mony","Hov","Reguletor"],["Chicken","Lush","Mechton"],["Cash","Jibba","natee"],["jayrosez","Dog","Zinqxz"],["Symetrical","Temple","wavyjacob"],["Trashy","Verny","exe"],["Jarritos","Keto","Walay"],["defiable","Salko","Kaboo"],["Combxt","Zays","Ordepz"],["Nach","G5RC","Antraxs"],["Drew","Kuhvn","Cheatrs"],["Flixx","Mudio","Sirbrian"],["Falconer","KadenOX","4DRStorm"],["Jagveer","Batman Bugha","Wheels"],["Genshink","DragonRG","Deih"],["Quickamon","Rasso","Yawn"],["Ghouls","Pollo","Vlux"],["Lime","Chip","Rex"],["fakie","Yuki","Izo"],["Slick","ChickenItza","Alliege"]],"BR":[["OPai","Phzin","gsx"],["H4wwk","Wey","nov1ce"],["XI rynm","KBR","Diguera"],["guneves","edson","roomtrash6-.-"],["Pattaty","njrⓐⓢשٍّ","Kitoz"],["Cadu","seeyunǃ","EdRoadToGlory"],["Fishy","riqueessj.","Sanku"],["Frans","Filipe","Jpsk1ng"],["xxxxǃǃǃǃ","C9 blхckoutz","KING"],["Frosty ","Bagu","Redlee"],["Suetam","spitflow","K1nG"],["kaykywhale","insanofv.","Lorde"],["Liimaa","Xeat","fаcu on top"],["Collet","mojakhub","AG1RRE."],["dott1 wype mode","Barroso","Scarpa"],["tortugafishy","Eladiojal JM","Twistz 츠"],["nikti mt quente","gxT","nathes"],["Pingu","manocaki","hugody1"],["RustyK","Tecne","fazer"],["ᵐᵃˢᵗᵉᵉʳ","Persa","Nicks"],["xx never gone di","retake2bleeak47","klose"],["Nuti","Diamond","iKalifa PLS"],["yagasfv","Caduzin","Pastzk"],["Culiаcan","leleo","lorax "],["LaroKashi","Gangifishy","Magni"],["santidead22","keicox","fakkz endless"],["Snowspampiunpiun","gbzn 亗","twitter lereqfn"],["Sweet is back","champissj","xlг8"],["Bryan","Gustyx 7","FNCS 鬼"],["Pulga","PINA ICEMAN","Ed.Winter"],["Betto69Carabina","Cocak1ng","naviaposentado"],["tavarezao","лучший прицел","xLuchi7"],["unsualhino 懶惰","optıcalrr","BIG divecabot 10"],["Pulga","pina 00","Ed.Winter"]],"ASIA":[["Albedo","Dokn","Buyuriru"],["Ruri","Pepoclip","Koyota"],["Runa","raru","Yusea"],["Qjac","Naetor","Alice"],["Rainy","Ess","Peterpan"],["estebanosh","seаk.","backhou- -"],["2SNgNlalah","Jozya","Leyyner"],["MrPickels52","frenzy stan 윈터","SCION HOLDS W"],["upsilonε","clxxer","ALBA くりまんじゅう -v-"],["Moon ӝ","ALBA-A fa1zzy"],["Gyen","キリアンエンバぺ","cor fatman"],["Maesar","Bot","KUREN"],["Rxrx26","Yama","bykn"],["SwizzY","Zotax","Shamokiy"],["WildHawk","Maufin","Rimr"],["Zagou","Flot0r","goma"],["AdaM 水","Cigol 火","nocluebuddy12"],["미야.","Fram","Pina"],["Spayed","A2リテイルローのしゅうと","Jaemon"],["Minipiyo","よっしゃと太郎","User-3448db3db3"],["TinkerBel1x","seita isono","KENTAch"],["Rialy","Kogane","Kagetora"],["あんそにーていらー","Vallhd","おにぎり-.-"],["Koa","CODE_lCEMAN","KWZ Clemens"],["Mainly","マニマニRio","EDGE Ruisana"],["Syamu","badmind.","ぁさ."],["Masatxﱞ","Duduzera25","User-7cf55fe64f"],["Shunsyan","RizArt","Bob"],["Otome","EEHNOW","LODSTK"],["まる","Weathering.","RRRRRPRRRR"],["herokis .","mikufo777","ごっとまさくんだお"],["Fire","RazL","Shinckyfishy"],["Toraa","Æ IGNITE.soufini","Ank仲村"]],"ME":[["Snow","Raed less","Snowyka"],["Fahad","Yonx","Nm7"],["FKS","і lоve doоpie","P5EK"],["Hulks","kix.i","Bleed"],["Spy","Rapit","RV"],["SCYTES Hellon 廴","murloc is back","vagnaR."],["DRaFTell","Smsomfishy","Rakan Fo"],["Xx731","Hero","KiritoKun"],["Phaпtom2x","Kai","ABUFAL7"],["231ef7fe","Jounior 7","Eroxkun ʕᵒᴥᵒʔ"],["Balor","Adapter","Mansour"],["Poor","lil Mshary","br1ckzlǃ"],["Kroolsta1x","LeziX ","Exp Msg"],["M7SN 456","N ོ","LORDUID"],["NagaWithAttitude","Dexefite"],["mancity TT","MAXM0N","salman ay non"],["viiroos","Nаif 505","Lord"],["Modisk","fаhаd","Metab911 不"],["QnDx","Nachiiri","fb376e2a"],["Puma ","India on Top 7","iNOTTRX"],["Abdullah lalala","Escdark","Rudy M10"],["KuKi","Souriano","Nyle"],["stoyvaks","RdŁz","الموهوب سابقا"],["RuTzMK","ASМR FT","L2 SOJOD9"],["rtaw222","ŁvR","ＫＳＡ-"],["Faisal 17","FlixyGOTY 10","Wqzzi"],["kaiz_-","Medal Originz","cccovolskxiii"],["map xo","2912 Lozer","tackyfv"],["LND fzkLOLǃ","Kalgamer","RVL trikshotz"],["A7mdRqx","Таx.","Trickviv 7"],["L8afh ネ","PNR","7ámąnz"],["3jmy ","HisssBackkkkk","Smasher 7"],["EGOISTAAAAAAAAA","Crow M3touq","Sweatykunfvǃ"]],"OCE":[["Suns","vanner tuii","alex"],["dev0nhendryx","Scammed","xalky utch clay"],["VortexM","Jace","Sunz"],["Pumpkin","volx","Looter"],["Sorif","Oreo","Loyal Eshz 11 真"],["X2twins Jordan","x2twins Jesse","radius"],["Zedox","sio tzu","Raiku"],["Spiker","fab","Keemo 24ǃ"],["Jynx","danath","worthy"],["remi ihmo","overt zanzjerss","radial fa"],["APOLOXSMURDA","PWR BАSIL","sahilgoundar69"],["eggy","Macheew","DAWGSLAYERJOHN92"],["goeg.","Chef Jeff Lаd","Skits"],["Mildojos914","Moozsama","gіlle"],["Flenny","Cynical","cyrexブカ"],["Sierra Cabot","Gazer","Baily"],["Newbatoon","50ㅤ","рhluxzy"],["alz the carry","Oatley","Price"],["angy445","rhyzah","Mysty"],["Megadan","Sah4pf","Pogue"],["Jvano","Bluezie .","Maniaswag 神"],["dіstrict","bantis free","Tekmarr"],["2Faulty","Mooty Grimes","Lunr"],["Bathan","kuda","Rel"],["ryanvd2324","LOYAL DEATH ち","va Mammal7"],["Maihaze","Synxk","Twenty 6ix"],["Daresome","sрrоut","Soaked"],["srw uchiha","SNG xXgamergirlx","BMP"],["BLYNK","Zuruuyu","trexygod"],["Maw","aimer grizz 24","Atua"],["Fisher","Pâd","Heeney Fan"],["Holtay","Toyswagger","blynks"],["vF relay","ssjbobbfan","arken 11"]]};
// ==== /FNCS 2021 cal ====
// ==== FNCS 2022 cal (tools/splice-2022.js) ====
/* ---- FNCS 2022 в карьере ------------------------------------------------------
   Дуо весь год, Chapter 3. Даты и квоты — окна Epic с архива Tracker
   (tools/measured/tracker-2022-*.json), места финалов NA — Liquipedia (liqui-2022/);
   спека — docs/superpowers/specs/2026-09-27-career-year-2022-design.md.

   Три сезона FNCS (C3S1–C3S3) — «Мейджоры» карьеры: квалификаторы → полуфинал в три
   сессии → Гранд-финал. См. runCareerMajor2022. Осенью (C3S4) FNCS нет — дивизионные
   кубки Elite / Challenger / Contender, семь недель; потом Invitational в Роли. */
const CC_YEAR_2022_FROM='2021-12-06', CC_YEAR_2022_TO='2022-12-11';   // + Кубок наций после Роли
const CAREER_YEAR_2022=[
  // Мейджор 1 (C3S1): два квалификатора по три раунда, раунды 2 и 3 — одним вечером.
  ['2022-02-17','2022-02-17','Major1_2022_Q1R1','major'],
  ['2022-02-18','2022-02-18','Major1_2022_Q1R23','major'],
  ['2022-02-19','2022-02-19','Major1_2022_Q2R1','major'],
  ['2022-02-20','2022-02-20','Major1_2022_Q2R23','major'],
  ['2022-02-25','2022-02-25','Major1_2022_Semi1','major'],
  ['2022-02-26','2022-02-26','Major1_2022_Semi2','major'],
  ['2022-02-27','2022-02-27','Major1_2022_Semi3','major'],
  ['2022-03-05','2022-03-06','Major1_2022_Final','major'],
  // Мейджор 2 (C3S2): три квалификатора по четыре раунда.
  ['2022-05-02','2022-05-02','Major2_2022_Q1R1','major'],
  ['2022-05-04','2022-05-04','Major2_2022_Q1R2','major'],
  ['2022-05-05','2022-05-05','Major2_2022_Q1R3','major'],
  ['2022-05-06','2022-05-06','Major2_2022_Q1R4','major'],
  ['2022-05-07','2022-05-07','Major2_2022_Q2R12','major'],
  ['2022-05-08','2022-05-08','Major2_2022_Q2R34','major'],
  ['2022-05-13','2022-05-13','Major2_2022_Q3R1','major'],
  ['2022-05-14','2022-05-14','Major2_2022_Q3R23','major'],
  ['2022-05-15','2022-05-15','Major2_2022_Q3R4','major'],
  ['2022-05-20','2022-05-20','Major2_2022_Semi1','major'],
  ['2022-05-21','2022-05-21','Major2_2022_Semi2','major'],
  ['2022-05-22','2022-05-22','Major2_2022_Semi3','major'],
  ['2022-05-28','2022-05-29','Major2_2022_Final','major'],
  // Мейджор 3 (C3S3).
  ['2022-07-08','2022-07-08','Major3_2022_Q1R1','major'],
  ['2022-07-09','2022-07-09','Major3_2022_Q1R23','major'],
  ['2022-07-10','2022-07-10','Major3_2022_Q1R4','major'],
  ['2022-07-11','2022-07-11','Major3_2022_Q2R1','major'],
  ['2022-07-13','2022-07-13','Major3_2022_Q2R2','major'],
  ['2022-07-14','2022-07-14','Major3_2022_Q2R3','major'],
  ['2022-07-15','2022-07-15','Major3_2022_Q2R4','major'],
  ['2022-07-16','2022-07-16','Major3_2022_Q3R12','major'],
  ['2022-07-17','2022-07-17','Major3_2022_Q3R34','major'],
  ['2022-07-22','2022-07-22','Major3_2022_Semi1','major'],
  ['2022-07-23','2022-07-23','Major3_2022_Semi2','major'],
  ['2022-07-24','2022-07-24','Major3_2022_Semi3','major'],
  ['2022-08-13','2022-08-14','Major3_2022_Final','major'],
  // FNCS Invitational, PNC Arena (Роли), 12–13 ноября: 50 приглашённых дуо.
  ['2022-11-12','2022-11-13','Invitational2022','globals'],
  // Кубок наций — три субботы после Роли (выдумка режима, см. ccNationsBook).
  ['2022-11-26','2022-11-26','NationsTrial','nations'],
  ['2022-12-03','2022-12-03','NationsQual','nations'],
  ['2022-12-10','2022-12-10','NationsFinal','nations']
];
// Сезоны 2022-го — Chapter 3 (S19–S22), границы по патчам.
const CC_SEASONS_2022=[
  {id:'S19', from:'2021-12-05', to:'2022-03-19'},
  {id:'S20', from:'2022-03-20', to:'2022-06-04'},
  {id:'S21', from:'2022-06-05', to:'2022-09-17'},
  {id:'S22', from:'2022-09-18', to:'2022-12-03'}
];
/* Дивизионные кубки C3S4 (Tracker, S22_DivisionalCups): Elite по средам и пятницам, финал
   Elite в субботу; Challenger и Contender — в те же вечера. Placement Cup 24 сентября не
   играется: ступень ставится по рейтингу в день старта кубков (ccDiv22Place). */
const CC_CUP_WEEKS_2022=[
  ['S22_DivisionalCups','2022-09-28','2022-09-30','2022-10-01'],
  ['S22_DivisionalCups','2022-10-05','2022-10-07','2022-10-08'],
  ['S22_DivisionalCups','2022-10-12','2022-10-14','2022-10-15'],
  ['S22_DivisionalCups','2022-10-19','2022-10-21','2022-10-22'],
  ['S22_DivisionalCups','2022-10-26','2022-10-28','2022-10-29'],
  ['S22_DivisionalCups','2022-11-02','2022-11-04','2022-11-05'],
  ['S22_DivisionalCups','2022-11-16','2022-11-18','2022-11-19']
];
// Дивизионы 2022-го живут только в C3S4: с Placement Cup до финала седьмой недели.
const CC_DIV_FROM_2022='2022-09-24', CC_DIV_END_2022='2022-11-19';
// Обложки дней 2022-го — остров своего сезона (Мейджор n — k<n>, Роли — k4).
CAREER_YEAR_2022.forEach(r=>{
  const m=/^Major(\d)_2022_/.exec(r[2]);
  if(m && !CAREER_EV_ART_ID[r[2]]) CAREER_EV_ART_ID[r[2]]='art/map-k'+m[1]+'.jpg';
});
CAREER_EV_ART_ID.Invitational2022='art/map-k4.jpg';
// Одна книга пар на год, как у 2023-го: пары Гранд-финалов и полуфиналов трёх сезонов (k1–k3).
const CC_SNAPSHOTS_2022=[
  /* По сезону (с его первого дня): составы — того FNCS, что шёл в этом сезоне. Соло-сезоны
     держат пары соседнего командного, C3S4 без онлайн-FNCS — C3S3. См. ccSnapshotNow. */
  {tag:'k1', from:CC_YEAR_2022_FROM, playIn:/2022 C3S1 . Grand Finals/, lcq:/2022 C3S1 . (Semi-Finals|Qualifier|Online Open|Week Finals|Week Qualifier)/},
  {tag:'k2', from:'2022-03-20', playIn:/2022 C3S2 . Grand Finals/, lcq:/2022 C3S2 . (Semi-Finals|Qualifier|Online Open|Week Finals|Week Qualifier)/},
  {tag:'k3', from:'2022-06-05', playIn:/2022 C3S3 . Grand Finals/, lcq:/2022 C3S3 . (Semi-Finals|Qualifier|Online Open|Week Finals|Week Qualifier)/}
];
// Generated by tools/build-2022-cal.js — капы, выплаты и Invitational FNCS 2022.
const CC_VICTORY_2022=[
  {day:'2022-01-10',id:'S19_DuosCashCup',mode:'duo',n:1,name:'Duos Cash Cup',pay:'S19'},
  {day:'2022-01-15',id:'S19_SoloCashCup',mode:'solo',n:1,name:'Solo Cash Cup',pay:'S19SOLO'},
  {day:'2022-01-19',id:'S19_DuosCashCup',mode:'duo',n:2,name:'Duos Cash Cup',pay:'S19'},
  {day:'2022-01-22',id:'S19_SoloCashCup',mode:'solo',n:2,name:'Solo Cash Cup',pay:'S19SOLO'},
  {day:'2022-01-24',id:'S19_DuosCashCup',mode:'duo',n:3,name:'Duos Cash Cup',pay:'S19'},
  {day:'2022-01-29',id:'S19_SoloCashCup',mode:'solo',n:3,name:'Solo Cash Cup',pay:'S19SOLO'},
  {day:'2022-01-31',id:'S19_DuosCashCup',mode:'duo',n:4,name:'Duos Cash Cup',pay:'S19'},
  {day:'2022-02-05',id:'S19_SoloCashCup',mode:'solo',n:4,name:'Solo Cash Cup',pay:'S19SOLO'},
  {day:'2022-02-07',id:'S19_DuosCashCup',mode:'duo',n:5,name:'Duos Cash Cup',pay:'S19'},
  {day:'2022-02-12',id:'S19_SoloCashCup',mode:'solo',n:5,name:'Solo Cash Cup',pay:'S19SOLO'},
  {day:'2022-02-14',id:'S19_DuosCashCup',mode:'duo',n:6,name:'Duos Cash Cup',pay:'S19'},
  {day:'2022-02-19',id:'S19_SoloCashCup',mode:'solo',n:6,name:'Solo Cash Cup',pay:'S19SOLO'},
  {day:'2022-02-21',id:'S19_DuosCashCup',mode:'duo',n:7,name:'Duos Cash Cup',pay:'S19'},
  {day:'2022-02-26',id:'S19_SoloCashCup',mode:'solo',n:7,name:'Solo Cash Cup',pay:'S19SOLO'},
  {day:'2022-03-07',id:'S19_DuosCashCup',mode:'duo',n:8,name:'Duos Cash Cup',pay:'S19'},
  {day:'2022-03-12',id:'S19_SoloCashCup',mode:'solo',n:8,name:'Solo Cash Cup',pay:'S19SOLO'},
  {day:'2022-03-14',id:'S19_SoloCashCup',mode:'solo',n:9,name:'Solo Cash Cup',pay:'S19SOLO'},
  {day:'2022-04-04',id:'S20_DuosCashCup',mode:'duo',n:1,name:'Duos Cash Cup',pay:'S20'},
  {day:'2022-04-09',id:'S20_SoloCashCup',mode:'solo',n:1,name:'Solo Cash Cup',pay:'S20SOLO'},
  {day:'2022-04-11',id:'S20_DuosCashCup',mode:'duo',n:2,name:'Duos Cash Cup',pay:'S20'},
  {day:'2022-04-16',id:'S20_SoloCashCup',mode:'solo',n:2,name:'Solo Cash Cup',pay:'S20SOLO'},
  {day:'2022-04-18',id:'S20_DuosCashCup',mode:'duo',n:3,name:'Duos Cash Cup',pay:'S20'},
  {day:'2022-04-23',id:'S20_SoloCashCup',mode:'solo',n:3,name:'Solo Cash Cup',pay:'S20SOLO'},
  {day:'2022-04-25',id:'S20_DuosCashCup',mode:'duo',n:4,name:'Duos Cash Cup',pay:'S20'},
  {day:'2022-04-30',id:'S20_SoloCashCup',mode:'solo',n:4,name:'Solo Cash Cup',pay:'S20SOLO'},
  {day:'2022-05-09',id:'S20_DuosCashCup',mode:'duo',n:5,name:'Duos Cash Cup',pay:'S20'},
  {day:'2022-05-16',id:'S20_DuosCashCup',mode:'duo',n:6,name:'Duos Cash Cup',pay:'S20'},
  {day:'2022-05-21',id:'S20_SoloCashCup',mode:'solo',n:5,name:'Solo Cash Cup',pay:'S20SOLO'},
  {day:'2022-05-23',id:'S20_DuosCashCup',mode:'duo',n:7,name:'Duos Cash Cup',pay:'S20'},
  {day:'2022-05-30',id:'S20_DuosCashCup',mode:'duo',n:8,name:'Duos Cash Cup',pay:'S20'},
  {day:'2022-06-25',id:'S21_DuosCashCup',mode:'duo',n:1,name:'Duos Cash Cup',pay:'S21'},
  {day:'2022-06-27',id:'S21_SoloCashCup',mode:'solo',n:1,name:'Solo Cash Cup',pay:'S21SOLO'},
  {day:'2022-07-02',id:'S21_DuosCashCup',mode:'duo',n:2,name:'Duos Cash Cup',pay:'S21'},
  {day:'2022-07-04',id:'S21_DuosCashCup',mode:'duo',n:3,name:'Duos Cash Cup',pay:'S21'},
  {day:'2022-07-19',id:'S21_DuosCashCup',mode:'duo',n:4,name:'Duos Cash Cup',pay:'S21'},
  {day:'2022-08-08',id:'S21_DuosCashCup',mode:'duo',n:5,name:'Duos Cash Cup',pay:'S21'},
  {day:'2022-08-15',id:'S21_SoloCashCup',mode:'solo',n:2,name:'Solo Cash Cup',pay:'S21SOLO'},
  {day:'2022-08-20',id:'S21_DuosCashCup',mode:'duo',n:6,name:'Duos Cash Cup',pay:'S21'},
  {day:'2022-08-22',id:'S21_SoloCashCup',mode:'solo',n:3,name:'Solo Cash Cup',pay:'S21SOLO'},
  {day:'2022-08-27',id:'S21_DuosCashCup',mode:'duo',n:7,name:'Duos Cash Cup',pay:'S21'},
  {day:'2022-08-29',id:'S21_SoloCashCup',mode:'solo',n:4,name:'Solo Cash Cup',pay:'S21SOLO'},
  {day:'2022-09-03',id:'S21_DuosCashCup',mode:'duo',n:8,name:'Duos Cash Cup',pay:'S21'},
  {day:'2022-09-05',id:'S21_SoloCashCup',mode:'solo',n:5,name:'Solo Cash Cup',pay:'S21SOLO'},
  {day:'2022-09-10',id:'S21_DuosCashCup',mode:'duo',n:9,name:'Duos Cash Cup',pay:'S21'},
  {day:'2022-09-12',id:'S21_SoloCashCup',mode:'solo',n:6,name:'Solo Cash Cup',pay:'S21SOLO'}
];
const CC_DCC_PAY_2022={S19:{EU:[[1,1250],[2,900],[3,850],[4,800],[5,750],[6,700],[7,650],[8,600],[9,550],[10,500],[15,400],[20,350],[25,325],[30,300],[35,275],[40,250]],NAC:[[1,600],[2,500],[3,475],[4,450],[5,425],[6,400],[7,375],[8,350],[9,325],[10,300],[15,275],[20,250],[25,225]],NAW:[[1,500],[2,300],[3,275],[4,250],[5,225],[10,200]],BR:[[1,550],[2,450],[3,425],[4,400],[5,375],[6,350],[7,325],[8,300],[9,275],[10,250],[15,225],[20,200]],ASIA:[[1,425],[2,275],[3,250],[4,225],[8,200]],ME:[[1,400],[2,250],[3,225],[6,200]],OCE:[[1,375],[4,300]]},S19SOLO:{EU:[[1,1000],[2,900],[3,800],[4,700],[5,600],[15,500],[25,450],[35,400],[45,300],[55,200]],NAC:[[1,800],[2,550],[3,500],[4,450],[5,400],[10,350],[15,300],[25,250],[35,200]],NAW:[[1,700],[2,450],[3,400],[4,350],[5,300],[10,250]],BR:[[1,750],[2,600],[3,500],[4,400],[5,350],[10,300],[15,250],[25,200]],ASIA:[[1,600],[2,400],[5,250],[8,200]],ME:[[1,500],[4,300],[7,200]],OCE:[[1,400],[2,300],[3,250],[6,200]]},S20:{EU:[[1,1250],[2,900],[3,850],[4,800],[5,750],[6,700],[7,650],[8,600],[9,550],[10,500],[15,400],[20,350],[25,325],[30,300],[35,275],[40,250]],NAC:[[1,600],[2,500],[3,475],[4,450],[5,425],[6,400],[7,375],[8,350],[9,325],[10,300],[15,275],[20,250],[25,225]],NAW:[[1,500],[2,300],[3,275],[4,250],[5,225],[10,200]],BR:[[1,550],[2,450],[3,425],[4,400],[5,375],[6,350],[7,325],[8,300],[9,275],[10,250],[15,225],[20,200]],ASIA:[[1,425],[2,275],[3,250],[4,225],[8,200]],ME:[[1,400],[2,250],[3,225],[6,200]],OCE:[[1,375],[4,300]]},S20SOLO:{EU:[[1,1000],[2,900],[3,800],[4,700],[5,600],[15,500],[25,450],[35,400],[45,300],[55,200]],NAC:[[1,800],[2,550],[3,500],[4,450],[5,400],[10,350],[15,300],[25,250],[35,200]],NAW:[[1,700],[2,450],[3,400],[4,350],[5,300],[10,250]],BR:[[1,750],[2,600],[3,500],[4,400],[5,350],[10,300],[15,250],[25,200]],ASIA:[[1,600],[2,400],[5,250],[8,200]],ME:[[1,500],[4,300],[7,200]],OCE:[[1,400],[2,300],[3,250],[6,200]]},S21:{EU:[[1,1250],[2,900],[3,850],[4,800],[5,750],[6,700],[7,650],[8,600],[9,550],[10,500],[15,400],[20,350],[25,325],[30,300],[35,275],[40,250]],NAC:[[1,600],[2,500],[3,475],[4,450],[5,425],[6,400],[7,375],[8,350],[9,325],[10,300],[15,275],[20,250],[25,225],[30,200]],NAW:[[1,350],[2,325],[3,300],[4,275],[5,250],[9,225],[12,200]],BR:[[1,350],[2,325],[3,300],[4,275],[5,250],[9,225],[12,200]],ASIA:[[1,350],[2,325],[3,300],[4,275],[5,250],[9,225],[12,200]],ME:[[1,325],[2,250],[3,225],[6,200]],OCE:[[1,325],[2,250],[3,225],[6,200]]},S21SOLO:{EU:[[1,1000],[2,900],[3,800],[4,700],[5,600],[15,500],[25,450],[35,400],[45,300],[55,200]],NAC:[[1,800],[2,550],[3,500],[4,450],[5,400],[10,350],[15,300],[25,250],[40,200]],NAW:[[1,650],[2,500],[3,450],[4,400],[5,350],[6,300],[9,250],[12,200]],BR:[[1,650],[2,500],[3,450],[4,400],[5,350],[6,300],[9,250],[12,200]],ASIA:[[1,650],[2,500],[3,450],[4,400],[5,350],[6,300],[9,250],[12,200]],ME:[[1,500],[4,300],[7,200]],OCE:[[1,500],[4,300],[7,200]]}};
const CC_MAJOR_PAY_2022={1:{EU:[[1,150000],[2,100000],[3,75000],[4,60000],[5,50000],[6,40000],[7,30000],[8,20000],[9,15000],[10,10000],[15,8000],[20,5000],[25,3500],[30,3000],[35,2500],[40,2000],[45,1500],[50,750]],NAC:[[1,65000],[2,45000],[3,35000],[4,28000],[5,20000],[6,16000],[7,12000],[8,9000],[9,7500],[10,5000],[15,4000],[20,3000],[25,2500],[30,2000],[35,1500],[40,1000],[45,750],[50,500]],NAW:[[1,22500],[2,18000],[3,14000],[4,11000],[5,9000],[6,7000],[7,5000],[8,4000],[9,3000],[10,2000],[15,1500],[20,1000],[25,600],[30,450],[35,400],[40,350],[45,300],[50,250]],BR:[[1,40000],[2,30000],[3,25000],[4,20000],[5,15000],[6,10000],[7,7500],[8,6000],[9,5000],[10,4000],[15,3000],[20,2000],[25,1500],[30,1000],[35,600],[40,450],[45,400],[50,350]],ASIA:[[1,15000],[2,10000],[3,8000],[4,5000],[5,4000],[6,3500],[7,3000],[8,2500],[9,2000],[10,1500],[15,1000],[20,700],[25,500],[30,400],[40,300],[50,200]],ME:[[1,12500],[2,8000],[3,6000],[4,3000],[5,2500],[6,2000],[7,1800],[8,1600],[9,1400],[10,1200],[15,900],[20,600],[25,500],[30,400],[40,300],[50,200]],OCE:[[1,9000],[2,6000],[3,4500],[4,2500],[5,2000],[6,1500],[7,1400],[8,1300],[9,1200],[10,1100],[15,800],[20,550],[25,400],[30,350],[40,300],[50,200]]},2:{EU:[[1,150000],[2,100000],[3,75000],[4,60000],[5,50000],[6,40000],[7,30000],[8,20000],[9,15000],[10,10000],[15,8000],[20,5000],[25,3500],[30,3000],[35,2500],[40,2000],[45,1500],[50,750]],NAC:[[1,65000],[2,45000],[3,35000],[4,28000],[5,20000],[6,16000],[7,12000],[8,9000],[9,7500],[10,5000],[15,4000],[20,3000],[25,2500],[30,2000],[35,1500],[40,1000],[45,750],[50,500]],NAW:[[1,22500],[2,18000],[3,14000],[4,11000],[5,9000],[6,7000],[7,5000],[8,4000],[9,3000],[10,2000],[15,1500],[20,1000],[25,600],[30,450],[35,400],[40,350],[45,300],[50,250]],BR:[[1,40000],[2,30000],[3,25000],[4,20000],[5,15000],[6,10000],[7,7500],[8,6000],[9,5000],[10,4000],[15,3000],[20,2000],[25,1500],[30,1000],[35,600],[40,450],[45,400],[50,350]],ASIA:[[1,15000],[2,10000],[3,8000],[4,5000],[5,4000],[6,3500],[7,3000],[8,2500],[9,2000],[10,1500],[15,1000],[20,700],[25,500],[30,400],[40,300],[50,200]],ME:[[1,12500],[2,8000],[3,6000],[4,3000],[5,2500],[6,2000],[7,1800],[8,1600],[9,1400],[10,1200],[15,900],[20,600],[25,500],[30,400],[40,300],[50,200]],OCE:[[1,9000],[2,6000],[3,4500],[4,2500],[5,2000],[6,1500],[7,1400],[8,1300],[9,1200],[10,1100],[15,800],[20,550],[25,400],[30,350],[40,300],[50,200]]},3:{EU:[[1,150000],[2,100000],[3,75000],[4,60000],[5,50000],[6,40000],[7,30000],[8,20000],[9,15000],[10,10000],[15,8000],[20,5000],[25,3500],[30,3000],[35,2500],[40,2000],[45,1500],[50,750]],NAC:[[1,80000],[2,50000],[3,40000],[4,28000],[5,20000],[6,16000],[7,12000],[8,9000],[9,7500],[10,5000],[15,4000],[20,3000],[25,2500],[30,2000],[35,1500],[40,1200],[45,800],[50,700]],NAW:[[1,22500],[2,18000],[3,14000],[4,11000],[5,9000],[6,7000],[7,5000],[8,4000],[9,3000],[10,2000],[15,1500],[20,1000],[25,600],[30,450],[35,400],[40,350],[45,300],[50,250]],BR:[[1,20000],[2,15000],[3,12000],[4,9000],[5,8000],[6,7000],[7,6000],[8,5000],[9,4000],[10,3000],[15,2000],[20,1500],[25,1000],[30,600],[35,400],[40,300],[45,250],[50,200]],ASIA:[[1,20000],[2,15000],[3,12000],[4,9000],[5,8000],[6,7000],[7,6000],[8,5000],[9,4000],[10,3000],[15,2000],[20,1500],[25,1000],[30,600],[35,400],[40,300],[45,250],[50,200]],ME:[[1,12500],[2,8000],[3,6000],[4,3000],[5,2500],[6,2000],[7,1800],[8,1600],[9,1400],[10,1200],[15,900],[20,600],[25,500],[30,400],[40,300],[50,200]],OCE:[[1,12500],[2,8000],[3,6000],[4,3000],[5,2500],[6,2000],[7,1800],[8,1600],[9,1400],[10,1200],[15,900],[20,600],[25,500],[30,400],[40,300],[50,200]]}};
const CC_WF_PAY_2022={EU:[[1,5000],[2,2700],[3,1800],[10,900],[25,450],[40,300]],NAC:[[1,2500],[2,1200],[3,800],[10,400],[40,200]],NAW:[[1,1250],[2,600],[3,400],[40,200]],BR:[[1,1250],[2,600],[3,400],[40,200]],ASIA:[[1,1250],[2,600],[3,400],[40,200]],ME:[[1,1250],[2,600],[3,400],[40,200]],OCE:[[1,1250],[2,600],[3,400],[40,200]]};
const INV2022_DUOS=[["Setty","Kami"],["Veno","Queasy"],["Cented","Cold"],["Th0masHD","Trippernn"],["Phzin","Kitoz"],["Vortex","Hen"],["BadSniper","Noahreyli"],["JoeFN","zAndy"],["KBR","Xeat"],["Smite","Larson"],["Commandment","Avery"],["Klown","Refsgaard"],["Acorn","Edgey"],["Bevvys","Vortexers"],["Dukez","Clix"],["Malibuca","Merstach"],["Juu","Yousri"],["Vic0try0na","Merijn"],["Pinq","Anas"],["TruleX","Chico"],["Vadeal","JannisZ"],["Khanada","MackWood"],["Robban","Wox"],["Bacca","On1"],["Kewl","Yumi"],["K1nG","EdRoadToGlory"],["EpikWhale","Reet"],["Rapit","Andilex"],["Alice","Threats"],["Zagou","Merem"],["MrSavage","IDrop"],["TaySon","Chapix"],["Belusi","Hijoe"],["Runa","Pepo"],["Fatch","PaMstou"],["Bugha","Mero"],["Jamper","Peterbot"],["Skram","Chimp"],["Parz","Rays"],["Grolzz","Rifty"],["PabloWingu","Swag"],["favs","Snacky"],["Falconer","Hellfire"],["Mikson","artor"],["Rezon ay","aqua"],["Alex","Baily"],["Muz","Looter"],["Basil","Jace"],["Spy","FKS"],["Nov1ce","Retake"]];
const INV2022_SEATS={EU:22,NAC:10,BR:4,NAW:6,ME:2,ASIA:3,'?':1,OCE:2};
const INV2022_PRIZES={"1":200000,"2":140000,"3":120000,"4":90000,"5":70000,"6":60000,"7":50000,"8":40000,"9":30000,"10":20000,"11":16000,"12":14000,"13":10000,"14":9500,"15":8000,"16":7000,"17":7000,"18":7000,"19":7000,"20":7000,"21":6000,"22":6000,"23":6000,"24":6000,"25":6000,"26":4000,"27":4000,"28":4000,"29":4000,"30":4000,"31":3000,"32":3000,"33":3000,"34":3000,"35":3000,"36":2000,"37":2000,"38":2000,"39":2000,"40":2000,"41":1500,"42":1500,"43":1500,"44":1500,"45":1500,"46":1000,"47":1000,"48":1000,"49":1000,"50":1000};
// ==== /FNCS 2022 cal ====
/* ---- FNCS 2023 в карьере ------------------------------------------------------
   Отзыв: «сделай 2023 год теперь». Дуо весь год, Chapter 4. Снято с архива Tracker
   (tools/measured/tracker-2023-*.json) и Liquipedia (liqui-2023/); спека —
   docs/superpowers/specs/2026-09-27-career-year-2023-design.md.

   Мейджор 2023-го (Epic): три недели, у каждой Day 1 (открытый, топ-200) → Day 2
   (топ-50) → финал недели (50 дуо, шесть игр) — он даёт очки серии. Гранд-финал —
   50 дуо: топ серии и топ-10 Surge Week (у Мейджора 3 Surge нет — 50 по серии),
   двенадцать игр за два дня. После Мейджора 3 — Last Chance Major (Day 1 → топ-250
   → Day 2 → топ-50 → финал) в нижнюю сетку Копенгагена. См. runCareerMajor2023. */
// До 30.11: после Кубка наций — сезон OG (C4 Season OG, остров Главы 1): денежные OG Skirmish креаторов 5–6 и 17–19 ноября,
// Solo Victory и ZB Duos Victory Cash Cup 13–30 ноября (архив Epic).
const CC_YEAR_2023_FROM='2022-12-05', CC_YEAR_2023_TO='2023-11-30';   // + Кубок наций после Копенгагена
const CAREER_YEAR_2023=[
  // Мейджор 1 (C4S1): недели 2–5, 9–12, 16–19 февраля, Surge 26 февраля, финал 4–5 марта.
  ['2023-02-02','2023-02-02','Major1_2023_W1D1','major'],
  ['2023-02-03','2023-02-03','Major1_2023_W1D2','major'],
  ['2023-02-05','2023-02-05','Major1_2023_W1F','major'],
  ['2023-02-09','2023-02-09','Major1_2023_W2D1','major'],
  ['2023-02-10','2023-02-10','Major1_2023_W2D2','major'],
  ['2023-02-12','2023-02-12','Major1_2023_W2F','major'],
  ['2023-02-16','2023-02-16','Major1_2023_W3D1','major'],
  ['2023-02-17','2023-02-17','Major1_2023_W3D2','major'],
  ['2023-02-19','2023-02-19','Major1_2023_W3F','major'],
  ['2023-02-26','2023-02-26','Major1_2023_Surge','major'],
  ['2023-03-04','2023-03-05','Major1_2023_Final','major'],
  // Мейджор 2 (C4S2): недели 13–15, 20–22, 27–29 апреля, Surge 6 мая, финал 13–14 мая.
  ['2023-04-13','2023-04-13','Major2_2023_W1D1','major'],
  ['2023-04-14','2023-04-14','Major2_2023_W1D2','major'],
  ['2023-04-15','2023-04-15','Major2_2023_W1F','major'],
  ['2023-04-20','2023-04-20','Major2_2023_W2D1','major'],
  ['2023-04-21','2023-04-21','Major2_2023_W2D2','major'],
  ['2023-04-22','2023-04-22','Major2_2023_W2F','major'],
  ['2023-04-27','2023-04-27','Major2_2023_W3D1','major'],
  ['2023-04-28','2023-04-28','Major2_2023_W3D2','major'],
  ['2023-04-29','2023-04-29','Major2_2023_W3F','major'],
  ['2023-05-06','2023-05-06','Major2_2023_Surge','major'],
  ['2023-05-13','2023-05-14','Major2_2023_Final','major'],
  // Мейджор 3 (C4S3): недели 20–22, 27–29 июля, 3–5 августа, финал 12–13 августа (без Surge).
  ['2023-07-20','2023-07-20','Major3_2023_W1D1','major'],
  ['2023-07-21','2023-07-21','Major3_2023_W1D2','major'],
  ['2023-07-22','2023-07-22','Major3_2023_W1F','major'],
  ['2023-07-27','2023-07-27','Major3_2023_W2D1','major'],
  ['2023-07-28','2023-07-28','Major3_2023_W2D2','major'],
  ['2023-07-29','2023-07-29','Major3_2023_W2F','major'],
  ['2023-08-03','2023-08-03','Major3_2023_W3D1','major'],
  ['2023-08-04','2023-08-04','Major3_2023_W3D2','major'],
  ['2023-08-05','2023-08-05','Major3_2023_W3F','major'],
  ['2023-08-12','2023-08-13','Major3_2023_Final','major'],
  // Last Chance Major 18–20 августа — «Мейджор 4» машины 2023-го.
  ['2023-08-18','2023-08-18','Major4_2023_W1D1','major'],
  ['2023-08-19','2023-08-19','Major4_2023_W1D2','major'],
  ['2023-08-20','2023-08-20','Major4_2023_W1F','major'],
  // Копенгаген, Royal Arena, 13–15 октября: верхняя сетка, нижняя, финал. См. runCareerGlobals2023.
  ['2023-10-13','2023-10-15','GlobalChampionship2023','globals'],
  // Кубок наций — три субботы после Копенгагена (выдумка режима, см. ccNationsBook).
  ['2023-10-21','2023-10-21','NationsTrial','nations'],
  ['2023-10-28','2023-10-28','NationsQual','nations'],
  ['2023-11-04','2023-11-04','NationsFinal','nations']
];
// Сезоны 2023-го — Chapter 4 (S23–S26), границы по патчам.
const CC_SEASONS_2023=[
  {id:'S23', from:'2022-12-04', to:'2023-03-09'},
  {id:'S24', from:'2023-03-10', to:'2023-06-08'},
  {id:'S25', from:'2023-06-09', to:'2023-08-24'},
  {id:'S26', from:'2023-08-25', to:'2023-11-02'},
  {id:'S27', from:'2023-11-03', to:'2023-12-02'}   // Season OG
];
// Обложки дней 2023-го — остров своего финала (Мейджор n — e<n>, Last Chance Major — e4).
CAREER_YEAR_2023.forEach(r=>{
  const m=/^Major(\d)_2023_/.exec(r[2]);
  if(m && !CAREER_EV_ART_ID[r[2]]) CAREER_EV_ART_ID[r[2]]='art/map-e'+Math.min(+m[1], 4)+'.jpg';
});
// Дивизионы C4S1 (январь — март) — см. CC_CUP_WEEKS_2023 ниже, у кубков.
// ==== FNCS 2023 cal (tools/splice-2023-rows.js) ====
// Generated by tools/build-2023-cal.js — капы и выплаты FNCS 2023 с Tracker.
const CC_VICTORY_2023=[
  {day:'2023-01-07',id:'S23_SoloCashCup',mode:'solo',n:1,name:'Solo Cash Cup',cash:100},
  {day:'2023-01-14',id:'S23_SoloCashCup',mode:'solo',n:2,name:'Solo Cash Cup',cash:100},
  {day:'2023-01-21',id:'S23_SoloCashCup',mode:'solo',n:3,name:'Solo Cash Cup',cash:100},
  {day:'2023-01-28',id:'S23_SoloCashCup',mode:'solo',n:4,name:'Solo Cash Cup',cash:100},
  {day:'2023-02-04',id:'S23_SoloCashCup',mode:'solo',n:5,name:'Solo Cash Cup',cash:100},
  {day:'2023-02-11',id:'S23_SoloCashCup',mode:'solo',n:6,name:'Solo Cash Cup',cash:100},
  {day:'2023-02-18',id:'S23_SoloCashCup',mode:'solo',n:7,name:'Solo Cash Cup',cash:100},
  {day:'2023-02-25',id:'S23_SoloCashCup',mode:'solo',n:8,name:'Solo Cash Cup',cash:100},
  {day:'2023-03-04',id:'S23_SoloCashCup',mode:'solo',n:9,name:'Solo Cash Cup',cash:100},
  {day:'2023-03-31',id:'S24_DuosCashCup',mode:'duo',n:1,name:'Duos Cash Cup',pay:'S24'},
  {day:'2023-04-02',id:'S24_SoloVictoryCup',mode:'solo',n:1,name:'Solo Victory Cup',cash:100},
  {day:'2023-04-07',id:'S24_DuosCashCup',mode:'duo',n:2,name:'Duos Cash Cup',pay:'S24'},
  {day:'2023-04-09',id:'S24_SoloVictoryCup',mode:'solo',n:2,name:'Solo Victory Cup',cash:100},
  {day:'2023-04-16',id:'S24_SoloVictoryCup',mode:'solo',n:3,name:'Solo Victory Cup',cash:100},
  {day:'2023-04-23',id:'S24_SoloVictoryCup',mode:'solo',n:4,name:'Solo Victory Cup',cash:100},
  {day:'2023-04-30',id:'S24_SoloVictoryCup',mode:'solo',n:5,name:'Solo Victory Cup',cash:100},
  {day:'2023-05-04',id:'S24_DuosCashCup',mode:'duo',n:3,name:'Duos Cash Cup',pay:'S24'},
  {day:'2023-05-07',id:'S24_SoloVictoryCup',mode:'solo',n:6,name:'Solo Victory Cup',cash:100},
  {day:'2023-05-11',id:'S24_DuosCashCup',mode:'duo',n:4,name:'Duos Cash Cup',pay:'S24'},
  {day:'2023-05-14',id:'S24_SoloVictoryCup',mode:'solo',n:7,name:'Solo Victory Cup',cash:100},
  {day:'2023-05-26',id:'S24_DuosCashCup',mode:'duo',n:5,name:'Duos Cash Cup',pay:'S24'},
  {day:'2023-05-28',id:'S24_SoloVictoryCup',mode:'solo',n:8,name:'Solo Victory Cup',cash:100},
  {day:'2023-06-02',id:'S24_DuosCashCup',mode:'duo',n:6,name:'Duos Cash Cup',pay:'S24'},
  {day:'2023-06-18',id:'S25_SoloVictoryCashCup',mode:'solo',n:1,name:'Solo Victory Cup',cash:100},
  {day:'2023-06-23',id:'S25_DuosCashCup',mode:'duo',n:1,name:'Duos Cash Cup',pay:'S25'},
  {day:'2023-06-25',id:'S25_SoloVictoryCashCup',mode:'solo',n:2,name:'Solo Victory Cup',cash:100},
  {day:'2023-06-28',id:'S25_DuosCashCup',mode:'duo',n:2,name:'Duos Cash Cup',pay:'S25'},
  {day:'2023-06-30',id:'S25_SoloVictoryCashCup',mode:'solo',n:3,name:'Solo Victory Cup',cash:100},
  {day:'2023-07-17',id:'S25_DuosCashCup',mode:'duo',n:3,name:'Duos Cash Cup',pay:'S25'},
  {day:'2023-07-23',id:'S25_SoloVictoryCashCup',mode:'solo',n:4,name:'Solo Victory Cup',cash:100},
  {day:'2023-07-24',id:'S25_DuosCashCup',mode:'duo',n:4,name:'Duos Cash Cup',pay:'S25'},
  {day:'2023-07-30',id:'S25_SoloVictoryCashCup',mode:'solo',n:5,name:'Solo Victory Cup',cash:100},
  {day:'2023-07-31',id:'S25_DuosCashCup',mode:'duo',n:5,name:'Duos Cash Cup',pay:'S25'},
  {day:'2023-08-06',id:'S25_SoloVictoryCashCup',mode:'solo',n:6,name:'Solo Victory Cup',cash:100},
  {day:'2023-08-09',id:'S25_DuosCashCup',mode:'duo',n:6,name:'Duos Cash Cup',pay:'S25'},
  {day:'2023-08-16',id:'S25_DuosCashCup',mode:'duo',n:7,name:'Duos Cash Cup',pay:'S25'},
  {day:'2023-08-21',id:'S25_DuosCashCup',mode:'duo',n:8,name:'Duos Cash Cup',pay:'S25'},
  {day:'2023-09-07',id:'S26_DuosCashCup',mode:'duo',n:1,name:'Duos Cash Cup',pay:'S26'},
  {day:'2023-09-10',id:'S26_SoloVictoryCashCup',mode:'solo',n:1,name:'Solo Victory Cup',cash:100},
  {day:'2023-09-14',id:'S26_DuosCashCup',mode:'duo',n:2,name:'Duos Cash Cup',pay:'S26'},
  {day:'2023-09-17',id:'S26_SoloVictoryCashCup',mode:'solo',n:2,name:'Solo Victory Cup',cash:100},
  {day:'2023-09-22',id:'S26_DuosCashCup',mode:'duo',n:3,name:'Duos Cash Cup',pay:'S26'},
  {day:'2023-09-24',id:'S26_SoloVictoryCashCup',mode:'solo',n:3,name:'Solo Victory Cup',cash:100},
  {day:'2023-09-29',id:'S26_DuosCashCup',mode:'duo',n:4,name:'Duos Cash Cup',pay:'S26'},
  {day:'2023-10-01',id:'S26_SoloVictoryCashCup',mode:'solo',n:4,name:'Solo Victory Cup',cash:100},
  {day:'2023-10-06',id:'S26_DuosCashCup',mode:'duo',n:5,name:'Duos Cash Cup',pay:'S26'},
  {day:'2023-10-08',id:'S26_SoloVictoryCashCup',mode:'solo',n:5,name:'Solo Victory Cup',cash:100},
  {day:'2023-10-20',id:'S26_DuosCashCup',mode:'duo',n:6,name:'Duos Cash Cup',pay:'S26'},
  {day:'2023-10-22',id:'S26_SoloVictoryCashCup',mode:'solo',n:6,name:'Solo Victory Cup',cash:100},
  {day:'2023-10-25',id:'S26_DuosCashCup',mode:'duo',n:7,name:'Duos Cash Cup',pay:'S26'},
  {day:'2023-11-01',id:'S26_DuosCashCup',mode:'duo',n:8,name:'Duos Cash Cup',pay:'S26'}
];
const CC_DCC_PAY_2023={S24:{EU:[[3,500],[4,450],[5,400],[6,350],[7,300],[8,250],[9,200],[10,150],[45,100]],NAC:[[3,500],[4,450],[5,400],[6,350],[7,300],[8,250],[9,200],[10,150],[45,100]],BR:[[3,250],[10,150],[40,100]],ASIA:[[3,250],[10,150],[40,100]],ME:[[1,250],[10,150],[40,100]],OCE:[[1,250],[10,150],[40,100]]},S25:{EU:[[3,500],[4,450],[5,400],[6,350],[7,300],[8,250],[9,200],[10,150],[45,100]],NAC:[[3,500],[4,450],[5,400],[6,350],[7,300],[8,250],[9,200],[10,150],[45,100]],BR:[[3,250],[10,150],[40,100]],ASIA:[[3,250],[10,150],[40,100]],ME:[[1,250],[10,150],[40,100]],OCE:[[1,250],[10,150],[40,100]]},S26:{EU:[[3,500],[4,450],[5,400],[6,350],[7,300],[8,250],[9,200],[10,150],[45,100]],NAC:[[3,500],[4,450],[5,400],[6,350],[7,300],[8,250],[9,200],[10,150],[45,100]],BR:[[3,250],[10,150],[40,100]],ASIA:[[3,250],[10,150],[40,100]],ME:[[1,250],[10,150],[40,100]],OCE:[[1,250],[10,150],[40,100]]}};
const CC_MAJOR_PAY_2023={1:{EU:[[1,100000],[2,60000],[3,50000],[4,40000],[5,30000],[6,25000],[7,20000],[8,15000],[9,10000],[10,7500],[15,5000],[20,4000],[25,3000],[30,2500],[35,2000],[40,1500],[45,1000],[50,500]],NAC:[[1,60000],[2,35000],[3,25000],[4,18000],[5,14000],[6,10000],[7,8000],[8,6000],[9,4000],[10,3000],[15,2500],[20,2000],[25,1500],[30,1000],[35,750],[40,500],[45,300],[50,200]],BR:[[1,15500],[2,12000],[3,9000],[4,7000],[5,6000],[6,5000],[7,4000],[8,3000],[9,2000],[10,1500],[15,1000],[20,750],[25,500],[30,300],[50,100]],ASIA:[[1,15500],[2,12000],[3,9000],[4,7000],[5,6000],[6,5000],[7,4000],[8,3000],[9,2000],[10,1500],[15,1000],[20,750],[25,500],[30,300],[50,100]],ME:[[1,10000],[2,6000],[3,4000],[4,1800],[5,1500],[6,1300],[7,1200],[8,1100],[9,1000],[10,900],[15,800],[20,500],[25,300],[30,200],[50,100]],OCE:[[1,10000],[2,6000],[3,4000],[4,1800],[5,1500],[6,1300],[7,1200],[8,1100],[9,1000],[10,900],[15,800],[20,500],[25,300],[30,200],[50,100]]},2:{EU:[[1,100000],[2,60000],[3,50000],[4,40000],[5,30000],[6,25000],[7,20000],[8,15000],[9,10000],[10,7500],[15,5000],[20,4000],[25,3000],[30,2500],[35,2000],[40,1500],[45,1000],[50,500]],NAC:[[1,75000],[2,47500],[3,34000],[4,25000],[5,20000],[6,15000],[7,12000],[8,9000],[9,6000],[10,4500],[15,3500],[20,2750],[25,2000],[30,1300],[35,850],[40,600],[45,400],[50,300]],BR:[[1,15500],[2,12000],[3,9000],[4,7000],[5,6000],[6,5000],[7,4000],[8,3000],[9,2000],[10,1500],[15,1000],[20,750],[25,500],[30,300],[50,100]],ASIA:[[1,15500],[2,12000],[3,9000],[4,7000],[5,6000],[6,5000],[7,4000],[8,3000],[9,2000],[10,1500],[15,1000],[20,750],[25,500],[30,300],[50,100]],ME:[[1,10000],[2,6000],[3,4000],[4,1800],[5,1500],[6,1300],[7,1200],[8,1100],[9,1000],[10,900],[15,800],[20,500],[25,300],[30,200],[50,100]],OCE:[[1,10000],[2,6000],[3,4000],[4,1800],[5,1500],[6,1300],[7,1200],[8,1100],[9,1000],[10,900],[15,800],[20,500],[25,300],[30,200],[50,100]]},3:{EU:[[1,100000],[2,60000],[3,50000],[4,40000],[5,30000],[6,25000],[7,20000],[8,15000],[9,10000],[10,7500],[15,5000],[20,4000],[25,3000],[30,2500],[35,2000],[40,1500],[45,1000],[50,500]],NAC:[[1,75000],[2,47500],[3,34000],[4,25000],[5,20000],[6,15000],[7,12000],[8,9000],[9,6000],[10,4500],[15,3500],[20,2750],[25,2000],[30,1300],[35,850],[40,600],[45,400],[50,300]],BR:[[1,15500],[2,12000],[3,9000],[4,7000],[5,6000],[6,5000],[7,4000],[8,3000],[9,2000],[10,1500],[15,1000],[20,750],[25,500],[30,300],[50,100]],ASIA:[[1,15500],[2,12000],[3,9000],[4,7000],[5,6000],[6,5000],[7,4000],[8,3000],[9,2000],[10,1500],[15,1000],[20,750],[25,500],[30,300],[50,100]],ME:[[1,10000],[2,6000],[3,4000],[4,1800],[5,1500],[6,1300],[7,1200],[8,1100],[9,1000],[10,900],[15,800],[20,500],[25,300],[30,200],[50,100]],OCE:[[1,10000],[2,6000],[3,4000],[4,1800],[5,1500],[6,1300],[7,1200],[8,1100],[9,1000],[10,900],[15,800],[20,500],[25,300],[30,200],[50,100]]}};
const GC2023_DUOS={m1:[["Merstach","TaySon"],["Malibuca","Th0masHD"],["Acorn","Cold"],["Boltz","THORIK"],["Kitoz","Phzin"],["Pepo","Zagou"],["Anon","Suns"],["QnDx","Rapit"]],m2:[["Queasy","Veno"],["Karmy","Vanyak3kk"],["Kami","Setty"],["Flickzy","Gripey"],["IDrop","Mappi"],["Dukez","Edgey"],["Cooper","Mero"],["Pollo","Sphinx"],["Fazer","K1nG"],["Jaemon","Yuma"],["Skits","Sorif"],["7man","Kalgamer"]],m3:[["Chico","TruleX"],["Misha","t3eny"],["Blacha","Mikson"],["Axeforce","Robban"],["PodaSai","Snayzy"],["Pinq","vic0"],["Grolzz","Klown"],["Fastroki","Kylie"],["Kyry","P1ng"],["charyy","G13ras"],["Ajerss","Khanada"],["Bugha","Threats"],["Eomzo","Rise"],["Brycx","Chubs"],["Bacca","Parz"],["Batman Bugha","Rapid"],["Reet","Ritual"],["Muz","paper"],["Source","Yumi"],["Okis"],["916Gon","Pingu"],["Gabzera","Nuti"],["axadasz","Stryker"],["Boby","Larkpex"],["DayDus","Stain"],["Mkmkpapa","Shelom"],["Alex","worthy"],["Mshx","Rew"],["FHD","Hero"]],lcm:[["MrSavage","Vadeal"],["Clement","Kyzen"],["Hen","Vaske1x"],["Belusi","Vortex"],["Fnajen","Moneymaker"],["JannisZ","rezon ay"],["Liwshe","Stenno"],["Cheatiin","Pixie"],["Bylah","Peterbot"],["Cented","Pxlarized"],["Death","Tahi"],["Clix","EpikWhale"],["Kwanti","Tkay"],["Krisp","Noxy"],["Fatch","PaMstou"],["Bully","Shadow"],["Fishy","Talls"],["Frosty","WeY"],["Persa","Diguera"],["Dog","Raru"],["Aim","Zazi"],["Gazer","River"],["Adapter","FKS"],["Kirb1","wickesy"]]};
const GC2023_SEATS={m1:{EU:2,NAC:2,BR:1,ASIA:1,OCE:1,ME:1},m2:{EU:5,NAC:3,BR:1,ASIA:1,OCE:1,ME:1},m3:{EU:10,NAC:11,BR:3,ASIA:3,ME:2},lcm:{EU:9,NAC:8,BR:3,ASIA:2,OCE:1,ME:1}};
const GC2023_PRIZES={"1":1000000,"2":650000,"3":400000,"4":300000,"5":200000,"6":150000,"7":120000,"8":100000,"9":80000,"10":50000,"11":50000,"12":50000,"13":50000,"14":50000,"15":50000,"16":30000,"17":30000,"18":30000,"19":30000,"20":30000,"21":20000,"22":20000,"23":20000,"24":20000,"25":20000,"26":18000,"27":18000,"28":18000,"29":18000,"30":18000,"31":16000,"32":16000,"33":16000,"34":16000,"35":16000,"36":14000,"37":14000,"38":14000,"39":14000,"40":14000,"41":12000,"42":12000,"43":12000,"44":12000,"45":12000,"46":10000,"47":10000,"48":10000,"49":10000,"50":10000,"51":4000,"52":4000,"53":4000,"54":4000,"55":4000,"56":4000,"57":4000,"58":4000,"59":4000,"60":4000,"61":4000,"62":4000,"63":4000,"64":4000,"65":4000,"66":4000,"67":4000,"68":4000,"69":4000,"70":4000,"71":4000,"72":4000,"73":4000};
// ==== /FNCS 2023 cal ====
/* ---- FNCS 2024 в карьере ----
   Дуо весь год. Источники: tools/measured/tracker-2024-eu.json (окна EU), tracker-2024-regions.json (выплаты шести
   регионов, NA West в 2024 не было), Liquipedia (формат полуфиналов, Форт-Уэрт).
   Мейджор: два открытых квала (у EU и NAC 4 раунда, здесь у всех 3, раунд в вечер, отсечки 1000 → 250 → очки
   серии), полуфиналы в две сетки (верхняя топ-50 серии: пт/сб по 5 игр, победа в матче = финал, вс 3 игры топ-25;
   нижняя 51–250: пт 10, сб 6, вс 3, топ-15), финал 50 дуо, 12 игр за два дня (×1.5 второго дня не считаем).
   Очки серии линейные по месту последнего раунда (таблицы Epic в архиве нет). См. runCareerMajor2024. */
// До 30.11: после Форт-Уэрта — капы Главы 5 Сезона 4 (октябрь) и Chapter 2 Remix (2–30 ноября, остров Главы 2 Сезона 2):
// Trios Cash Cup, Solo Victory, Reload-капы из архива Epic.
const CC_YEAR_2024_FROM='2023-12-05', CC_YEAR_2024_TO='2024-11-30';   // + Кубок наций после Форт-Уэрта
const CAREER_YEAR_2024=[
  // Кубок наций — закрытие сезона, три субботы после последнего турнира FNCS (выдумка режима, см. ccNationsBook).
  ['2024-09-14','2024-09-14','NationsTrial','nations'],
  ['2024-09-21','2024-09-21','NationsQual','nations'],
  ['2024-09-28','2024-09-28','NationsFinal','nations'],
  // Major 1 (S28): квалификаторы 26–28 января и 2–4 февраля, полуфиналы 16–18 февраля, финал 24–25 февраля.
  ['2024-01-26','2024-01-26','Major1_2024_Q1R1','major'],
  ['2024-01-27','2024-01-27','Major1_2024_Q1R2','major'],
  ['2024-01-28','2024-01-28','Major1_2024_Q1R3','major'],
  ['2024-02-02','2024-02-02','Major1_2024_Q2R1','major'],
  ['2024-02-03','2024-02-03','Major1_2024_Q2R2','major'],
  ['2024-02-04','2024-02-04','Major1_2024_Q2R3','major'],
  ['2024-02-16','2024-02-16','Major1_2024_Semi1','major'],
  ['2024-02-17','2024-02-17','Major1_2024_Semi2','major'],
  ['2024-02-18','2024-02-18','Major1_2024_Semi3','major'],
  ['2024-02-24','2024-02-25','Major1_2024_Final','major'],
  // Major 2 (S29): 12–14 и 19–21 апреля, полуфиналы 10–12 мая, финал 18–19 мая.
  ['2024-04-12','2024-04-12','Major2_2024_Q1R1','major'],
  ['2024-04-13','2024-04-13','Major2_2024_Q1R2','major'],
  ['2024-04-14','2024-04-14','Major2_2024_Q1R3','major'],
  ['2024-04-19','2024-04-19','Major2_2024_Q2R1','major'],
  ['2024-04-20','2024-04-20','Major2_2024_Q2R2','major'],
  ['2024-04-21','2024-04-21','Major2_2024_Q2R3','major'],
  ['2024-05-10','2024-05-10','Major2_2024_Semi1','major'],
  ['2024-05-11','2024-05-11','Major2_2024_Semi2','major'],
  ['2024-05-12','2024-05-12','Major2_2024_Semi3','major'],
  ['2024-05-18','2024-05-19','Major2_2024_Final','major'],
  // Major 3 (S30): 14–16 и 21–23 июня, полуфиналы 19–21 июля, финал 27–28 июля.
  ['2024-06-14','2024-06-14','Major3_2024_Q1R1','major'],
  ['2024-06-15','2024-06-15','Major3_2024_Q1R2','major'],
  ['2024-06-16','2024-06-16','Major3_2024_Q1R3','major'],
  ['2024-06-21','2024-06-21','Major3_2024_Q2R1','major'],
  ['2024-06-22','2024-06-22','Major3_2024_Q2R2','major'],
  ['2024-06-23','2024-06-23','Major3_2024_Q2R3','major'],
  ['2024-07-19','2024-07-19','Major3_2024_Semi1','major'],
  ['2024-07-20','2024-07-20','Major3_2024_Semi2','major'],
  ['2024-07-21','2024-07-21','Major3_2024_Semi3','major'],
  ['2024-07-27','2024-07-28','Major3_2024_Final','major'],
  // Форт-Уэрт, 7–8 сентября 2024: 50 дуо, двенадцать игр, $2 000 000. Последнего шанса не было.
  ['2024-09-07','2024-09-08','GlobalChampionship2024','globals']
];
/* Капы с деньгами 2024-го (окна Tracker, только с выплатой): Duos Cash Cup — раунд 1
   открытый, раунд 2 на 6 игр с таблицей мест (pay — таблица на игрока, по региону);
   Solo Victory Cup — $100 на игрока за победу во втором раунде (три игры); Reload
   Duos Cash Cup (PC) 30 августа. Двухдневные капы стоят днём первого раунда.
   Zero Build, Squads Victory Cup, консольные и PlayStation Cup не взяты. */
const CC_VICTORY_2024=[
  {day:'2023-12-09', id:'S28_DuosCashCup', mode:'duo', n:1, name:'Duos Cash Cup', pay:'S28'},
  {day:'2023-12-17', id:'S28_DuosCashCup', mode:'duo', n:2, name:'Duos Cash Cup', pay:'S28'},
  {day:'2024-01-20', id:'S28_DuosCashCup', mode:'duo', n:3, name:'Duos Cash Cup', pay:'S28'},
  {day:'2024-01-24', id:'S28_DuosCashCup', mode:'duo', n:4, name:'Duos Cash Cup', pay:'S28'},
  {day:'2024-02-20', id:'S28_DuosCashCup', mode:'duo', n:5, name:'Duos Cash Cup', pay:'S28'},
  {day:'2024-03-30', id:'S29_DuosCashCup', mode:'duo', n:1, name:'Duos Cash Cup', pay:'S28'},
  {day:'2024-04-10', id:'S29_DuosCashCup', mode:'duo', n:2, name:'Duos Cash Cup', pay:'S28'},
  {day:'2024-04-15', id:'S29_DuosCashCup', mode:'duo', n:3, name:'Duos Cash Cup', pay:'S28'},
  {day:'2024-05-01', id:'S29_DuosCashCup', mode:'duo', n:4, name:'Duos Cash Cup', pay:'S28'},
  {day:'2024-06-05', id:'S30_DuosCashCup', mode:'duo', n:1, name:'Duos Cash Cup', pay:'S30'},
  {day:'2024-06-11', id:'S30_DuosCashCup', mode:'duo', n:2, name:'Duos Cash Cup', pay:'S30'},
  {day:'2024-06-19', id:'S30_DuosCashCup', mode:'duo', n:3, name:'Duos Cash Cup', pay:'S30'},
  {day:'2024-06-26', id:'S30_DuosCashCup', mode:'duo', n:4, name:'Duos Cash Cup', pay:'S30'},
  {day:'2024-07-17', id:'S30_DuosCashCup', mode:'duo', n:5, name:'Duos Cash Cup', pay:'S30'},
  {day:'2024-07-24', id:'S30_DuosCashCup', mode:'duo', n:6, name:'Duos Cash Cup', pay:'S30'},
  {day:'2024-07-31', id:'S30_DuosCashCup', mode:'duo', n:7, name:'Duos Cash Cup', pay:'S30'},
  {day:'2024-08-07', id:'S30_DuosCashCup', mode:'duo', n:8, name:'Duos Cash Cup', pay:'S30'},
  {day:'2024-08-28', id:'S31_DuosCashCup', mode:'duo', n:1, name:'Duos Cash Cup', pay:'S31'},
  {day:'2023-12-08', id:'S28_SoloVictoryCup', mode:'solo', n:1, name:'Solo Victory Cup', cash:100},
  {day:'2023-12-10', id:'S28_SoloVictoryCup', mode:'solo', n:2, name:'Solo Victory Cup', cash:100},
  {day:'2023-12-15', id:'S28_SoloVictoryCup', mode:'solo', n:3, name:'Solo Victory Cup', cash:100},
  {day:'2023-12-16', id:'S28_SoloVictoryCup', mode:'solo', n:4, name:'Solo Victory Cup', cash:100},
  {day:'2023-12-20', id:'S28_SoloVictoryCup', mode:'solo', n:5, name:'Solo Victory Cup', cash:100},
  {day:'2023-12-21', id:'S28_SoloVictoryCup', mode:'solo', n:6, name:'Solo Victory Cup', cash:100},
  {day:'2023-12-22', id:'S28_SoloVictoryCup', mode:'solo', n:7, name:'Solo Victory Cup', cash:100},
  {day:'2024-01-19', id:'S28_SoloVictoryCup', mode:'solo', n:8, name:'Solo Victory Cup', cash:100},
  {day:'2024-01-21', id:'S28_SoloVictoryCup', mode:'solo', n:9, name:'Solo Victory Cup', cash:100},
  {day:'2024-02-09', id:'S28_SoloVictoryCup', mode:'solo', n:10, name:'Solo Victory Cup', cash:100},
  {day:'2024-02-11', id:'S28_SoloVictoryCup', mode:'solo', n:11, name:'Solo Victory Cup', cash:100},
  {day:'2024-03-17', id:'S29_SoloVictoryCup', mode:'solo', n:1, name:'Solo Victory Cup', cash:100},
  {day:'2024-03-22', id:'S29_SoloVictoryCup', mode:'solo', n:2, name:'Solo Victory Cup', cash:100},
  {day:'2024-03-29', id:'S29_SoloVictoryCup', mode:'solo', n:3, name:'Solo Victory Cup', cash:100},
  {day:'2024-03-31', id:'S29_SoloVictoryCup', mode:'solo', n:4, name:'Solo Victory Cup', cash:100},
  {day:'2024-04-03', id:'S29_SoloVictoryCup', mode:'solo', n:5, name:'Solo Victory Cup', cash:100},
  {day:'2024-04-24', id:'S29_SoloVictoryCup', mode:'solo', n:6, name:'Solo Victory Cup', cash:100},
  {day:'2024-05-05', id:'S29_SoloVictoryCup', mode:'solo', n:7, name:'Solo Victory Cup', cash:100},
  {day:'2024-06-03', id:'S30_SoloVictoryCup', mode:'solo', n:1, name:'Solo Victory Cup', cash:100},
  {day:'2024-06-10', id:'S30_SoloVictoryCup', mode:'solo', n:2, name:'Solo Victory Cup', cash:100},
  {day:'2024-06-17', id:'S30_SoloVictoryCup', mode:'solo', n:3, name:'Solo Victory Cup', cash:100},
  {day:'2024-06-24', id:'S30_SoloVictoryCup', mode:'solo', n:4, name:'Solo Victory Cup', cash:100},
  {day:'2024-07-15', id:'S30_SoloVictoryCup', mode:'solo', n:5, name:'Solo Victory Cup', cash:100},
  {day:'2024-07-22', id:'S30_SoloVictoryCup', mode:'solo', n:6, name:'Solo Victory Cup', cash:100},
  {day:'2024-07-29', id:'S30_SoloVictoryCup', mode:'solo', n:7, name:'Solo Victory Cup', cash:100},
  {day:'2024-08-05', id:'S30_SoloVictoryCup', mode:'solo', n:8, name:'Solo Victory Cup', cash:100},
  {day:'2024-08-12', id:'S30_SoloVictoryCup', mode:'solo', n:9, name:'Solo Victory Cup', cash:100},
  {day:'2024-09-02', id:'S31_SoloVictoryCup', mode:'solo', n:1, name:'Solo Victory Cup', cash:100},
  // Reload Duos Cash Cup 30.08 снят: Reload — только в 2026-м (отзыв).
];
// Таблицы выплат 2024-го — на игрока, [место-порог, $]; NA West читает NA Central.
const CC_MAJOR_PAY_2024={
  EU:[[1,85000],[2,60000],[3,50000],[4,40000],[5,30000],[6,25000],[7,20000],[8,15000],[9,10000],[10,7500],[15,5000],[20,4000],[25,3000],[30,2500],[35,2000],[40,1500],[45,1000],[50,500]],
  NAC:[[1,70000],[2,45000],[3,35000],[4,30000],[5,25000],[6,18000],[7,15000],[8,12500],[9,7000],[10,5500],[15,3750],[20,3000],[25,2250],[30,1500],[35,1000],[45,750],[50,500]],
  BR:[[1,10000],[2,7000],[3,5500],[4,4500],[5,3250],[6,2250],[7,1500],[8,1300],[9,1200],[10,1000],[15,750],[20,500],[25,250],[50,100]],
  ASIA:[[1,10000],[2,7000],[3,5500],[4,4500],[5,3250],[6,2250],[7,1500],[8,1300],[9,1200],[10,1000],[15,750],[20,500],[25,250],[50,100]],
  ME:[[1,10000],[2,7000],[3,5500],[4,4500],[5,3250],[6,2250],[7,1500],[8,1300],[9,1200],[10,1000],[15,750],[20,500],[25,250],[50,100]],
  OCE:[[1,8000],[2,5000],[3,3000],[4,2000],[5,1750],[6,1400],[7,1300],[8,1200],[9,1100],[10,1000],[15,500],[20,250],[50,100]]
};
const CC_DCC_PAY_2024={
  S28:{EU:[[1,2000],[2,1750],[3,1250],[4,1000],[5,875],[6,750],[7,625],[8,500],[9,425],[10,400],[11,325],[12,300],[13,275],[14,250],[15,225],[19,175],[20,150],[35,125],[50,100]], NAC:[[1,1600],[2,1250],[3,1000],[4,875],[5,750],[6,500],[7,375],[8,350],[9,300],[10,250],[15,175],[25,125],[50,100]], BR:[[1,275],[2,250],[3,225],[4,175],[5,150],[8,125],[10,100]], ASIA:[[1,275],[2,250],[3,225],[4,175],[5,150],[8,125],[10,100]], ME:[[1,275],[2,250],[3,225],[4,175],[5,150],[8,125],[10,100]], OCE:[[1,250],[2,200],[5,180]]},
  S30:{EU:[[1,2500],[2,1350],[3,900],[10,450],[25,300],[40,150]], NAC:[[1,2500],[2,1350],[3,900],[10,450],[25,300],[40,150]], BR:[[1,625],[2,400],[3,300],[5,200],[40,100]], ASIA:[[1,625],[2,400],[3,300],[5,200],[40,100]], ME:[[1,625],[2,400],[3,300],[5,200],[40,100]], OCE:[[1,625],[2,400],[3,300],[5,200],[40,100]]},
  S31:{EU:[[1,5000],[2,1350],[3,900],[10,450],[25,300],[40,150]], NAC:[[1,5000],[2,1350],[3,900],[10,450],[25,225],[40,100]], BR:[[1,625],[2,400],[3,300],[5,200],[40,100]], ASIA:[[1,625],[2,400],[3,300],[5,200],[40,100]], ME:[[1,625],[2,400],[3,300],[5,200],[40,100]], OCE:[[1,625],[2,400],[3,300],[5,200],[40,100]]}
};
const CC_RDCC_PAY_2024={EU:[[1,2500],[2,675],[3,450],[10,225]], NAC:[[1,2500],[2,675],[3,450],[10,225]], BR:[[1,325],[2,200],[3,150],[5,100],[10,50]], ASIA:[[1,325],[2,200],[3,150],[5,100],[10,50]], ME:[[1,325],[2,200],[3,150],[5,100],[10,50]], OCE:[[1,325],[2,200],[3,150],[5,100],[10,50]]};

function ccPay24Table(tables){
  // У 2022-го NA West платил своей таблицей; где её нет — таблица NA Central.
  let r=careerPrizeRegion(); if(r==='NAW' && !(tables && tables.NAW)) r='NAC';
  return (tables && (tables[r] || tables.EU)) || null;
}
function ccPay24(tables, place){
  const t=ccPay24Table(tables); if(!t) return 0;
  const row=t.find(x=>place<=x[0]);
  return row ? row[1] : 0;
}
// Кап с таблицей мест (Duos Cash Cup / Reload Duos Cash Cup): выплата на состав.
// Сколько человек в команде на этом капе: на вечере — CC_EVENT_SIZE, до него — формат капа (трио-кап дуо-года
// играется тройкой со стэнд-ином, ccEventRosterBegin), в онлайне и гонке формат не меняется.
function ccVictoryTeamSize(ev){
  if(CC_EVENT_SIZE) return CC_EVENT_SIZE;
  const f=ccVictoryFormat(ev);
  if(f && !(typeof ccMpOn==='function' && ccMpOn()) && !(typeof ccRacePairOn==='function' && ccRacePairOn())) return f;
  return careerSquadSize();
}
function ccVictoryPayOf(ev, place){
  // Кап из архива Tracker несёт таблицу Epic с собой: по регионам, «до места N — сумма на игрока».
  if(ev && ev.payT) return ccPay24(ev.payT, place)*(ev.mode==='solo' ? 1 : ccVictoryTeamSize(ev));
  if(!ev || !ev.pay) return 0;
  // 2023-й — свои сезоны (S24–S26) в CC_DCC_PAY_2023.
  const t=ev.pay==='RDCC' ? CC_RDCC_PAY_2024 : (ccIs2019() && CC_DCC_PAY_2019[ev.pay]) ? CC_DCC_PAY_2019[ev.pay] : (ccIs2021() && CC_DCC_PAY_2021[ev.pay]) ? CC_DCC_PAY_2021[ev.pay] : (ccIs2022() && CC_DCC_PAY_2022[ev.pay]) ? CC_DCC_PAY_2022[ev.pay] : (ccIs2023() && CC_DCC_PAY_2023[ev.pay]) ? CC_DCC_PAY_2023[ev.pay] : CC_DCC_PAY_2024[ev.pay];
  // Соло-кап 2022-го платит таблицей на одного.
  return ccPay24(t, place)*(ev.mode==='solo' ? 1 : ccVictoryTeamSize(ev));
}
/* Victory Cash Cup из архива: таблица Epic у него по очкам раунда 2 (100 за победу → $100, 200 → $200,
   300 → $300 на игрока), а не по месту. Читали её как места 1–100, и в комнате прошедших платили всем,
   в том числе командам без побед. Перевод: сумма на игрока за одну победу, 0 — таблица обычная. */
function ccVicPerWin(ev){
  const t=ev && ev.payT ? ccPay24Table(ev.payT) : null;
  if(!t || !t.length || !t.every(function(r, i){ return r[0]===100*(i+1); })) return 0;
  return t[0][1];
}
// Деньги команды за победы: строка таблицы по числу побед, побед больше строк — последняя строка.
function ccVicWinsCash(ev, wins, size){
  const t=ccPay24Table(ev.payT), w=Math.min(wins||0, t ? t.length : 0);
  return w ? t[w-1][1]*Math.max(1, size||1) : 0;
}
/* Снимки сцены 2024-го: дивизион 1 — сотня полуфиналов ближайшего Мейджора (верхняя
   и нижняя сетки), других дверей в 2024-м не было. Набор f2 — с первого квалификатора
   второго Мейджора, f3 — третьего. */
/* 2024: одна книга пар на весь год. С книгой на каждый Мейджор составы менялись посреди года, а у Мейджора 3
   отборочный записан на ~50 строк (CARD_F3*_Q_RAW), и люди без пары получали нового напарника каждый вечер.
   Теперь все три снимка читают весь год: 381/379/374 пары вместо 263/241/100. ccSeat сажает первого и пропускает
   занятых, так что книга сама дедуплицируется.
   Порядок решает, какая пара годовая: финалы (Форт-Уэрт, гранд-финалы), потом полуфиналы, потом отборочные, то
   есть пара, с которой прошёл дальше всего. Так P1ng с Wox (GC2024_M3_DUOS); «сначала полуфиналы» ставил бы его с
   Mikson.
   Даты и теги снимков оставлены: от них ключ кеша пула. */
/* 2023-й — та же одна книга пар на год, что у 2024-го: пары Гранд-финалов и финалов
   недель всех трёх Мейджоров (наборы e1–e3). */
const CC_SNAPSHOTS_2023=[
  /* По сезону (с его первого дня): составы — того FNCS, что шёл в этом сезоне. Соло-сезоны
     держат пары соседнего командного, C3S4 без онлайн-FNCS — C3S3. См. ccSnapshotNow. */
  {tag:'e1', from:CC_YEAR_2023_FROM, playIn:/2023 Major 1 . Grand Finals/, lcq:/2023 Major 1 . (Semi-Finals|Qualifier|Online Open|Week Finals|Week Qualifier)/},
  {tag:'e2', from:'2023-03-10', playIn:/2023 Major 2 . Grand Finals/, lcq:/2023 Major 2 . (Semi-Finals|Qualifier|Online Open|Week Finals|Week Qualifier)/},
  {tag:'e3', from:'2023-06-09', playIn:/2023 Major 3 . Grand Finals/, lcq:/2023 Major 3 . (Semi-Finals|Qualifier|Online Open|Week Finals|Week Qualifier)/}
];
const CC_SNAPSHOTS_2024=[
  {tag:'f1', from:CC_YEAR_2024_FROM, playIn:/2024 (Global Championship|Major [123] . Grand Finals)/, lcq:/2024 Major [123] . (Semi-Finals|Open Qualifier)/},
  {tag:'f2', from:'2024-04-12',      playIn:/2024 (Global Championship|Major [123] . Grand Finals)/, lcq:/2024 Major [123] . (Semi-Finals|Open Qualifier)/},
  {tag:'f3', from:'2024-06-14',      playIn:/2024 (Global Championship|Major [123] . Grand Finals)/, lcq:/2024 Major [123] . (Semi-Finals|Open Qualifier)/}
];
/* Форт-Уэрт 2024: места по Мейджорам и регионам — с участников Liquipedia
   (Fortnite Champion Series/2024): Мейджор 1 — семь дуо, Мейджор 2 — двенадцать,
   Мейджор 3 — тридцать одно; при уже занятом месте оно уходит следующему. */
const GC2024_M1_SEATS={EU:2, NAC:1, BR:1, ASIA:1, ME:1, OCE:1};
const GC2024_M2_SEATS={EU:5, NAC:3, BR:1, ASIA:1, ME:1, OCE:1};
const GC2024_M3_SEATS={EU:10, NAC:12, BR:2, ASIA:2, ME:3, OCE:2};
// Настоящие дуо Форт-Уэрта по дороге туда (Liquipedia, участники).
const GC2024_M1_DUOS=[['Malibuca','Merstach'],['Queasy','Th0masHD'],['Acorn','Cold'],['Cadu','Seeyun'],['Shelom','Zagou'],['7man','Kalgamer'],['alex','worthy']];
const GC2024_M2_DUOS=[['SwizzY','Japko'],['Chap','t3eny'],['Kami','Setty'],['rezon ay','Vadeal'],['Andilex','Seyyto'],['Peterbot','Pollo'],['Reet','Ritual'],['Cooper','Khanada'],['EdRoadToGlory','Persa'],['Job','Michael8'],['Adapter','FKS'],['danath','Tinka']];
const GC2024_M3_DUOS=[['Flickzy','vic0'],['Czb','Nxthan'],['P1ng','Wox'],['JannisZ','Pixie'],['Scroll','Sky'],['Cheapz','Krisp'],['Casperinovic','Prism'],['Chico','TruleX'],['charyy','G13ras'],['Huty','KovaaksXD'],['Batman Bugha','Rapid'],['Clix','Veno'],['Threats','Trashy'],['Dukez','Sphinx'],['Avivv','Bugha'],['Boltz','Brycx'],['paper','VicterV'],['EpikWhale','Muz'],['Shadow','Vergo'],['Bacca','Parz'],['Fazer','K1nG'],['916Gon','Kwanti'],['Kayky','Kchorro'],['Koyota','xMipoli'],['Rise','yuma'],['BOBY','Larkpex'],['Braydz','Visxals'],['Clone','KramSu'],['Ajerss','Rise'],['Aspect','Cazi'],['Deymo','Resignz']];
// $2 000 000 на 50 дуо — на команду (Liquipedia).
const GC2024_PRIZES={"1":400000,"2":300000,"3":200000,"4":160000,"5":120000,"6":90000,"7":60000,"8":50000,"9":40000,"10":30000,"11":24000,"12":24000,"13":24000,"14":24000,"15":24000,"16":20000,"17":20000,"18":20000,"19":20000,"20":20000,"21":16000,"22":16000,"23":16000,"24":16000,"25":16000,"26":14000,"27":14000,"28":14000,"29":14000,"30":14000,"31":12000,"32":12000,"33":12000,"34":12000,"35":12000,"36":10000,"37":10000,"38":10000,"39":10000,"40":10000,"41":8000,"42":8000,"43":8000,"44":8000,"45":8000,"46":6000,"47":6000,"48":6000,"49":6000,"50":6000};

/* Какой календарный год играет ТЕКУЩИЙ сезон карьеры.

   Отзыв: «сделай карьеру как для выбора с расписанием 2025
   года полностью и игроки тоже из того года». Год живёт на карьере (cr.year),
   как и размер состава: сейв без поля — 2026, каким он и был. Год 2025
   играется один раз, трио, и на стыке переходит в 2026 (cr.year0 помнит,
   с какого года карьера началась — от этого зависит сдвиг номеров сезонов и
   чётность дуо/трио). Всё, что раньше читало константы 2026 года, читает эти
   функции; сами константы остались как есть. */
function ccCalYear(){
  /* На экране создания год — это чип (отзыв: «сначала выбираешь
     год карьеры, потом игроков»): карточки и рейтинги в выборе идут за ним,
     а не за карьерой, которая могла остаться в памяти от другого слота. */
  if(typeof SHOWN_SCREEN!=='undefined' && SHOWN_SCREEN==='screen-career-create' && typeof CC!=='undefined' && CC)
    return ccPastYear(CC.year) ? CC.year : 2026;
  const cr=(typeof CAREER!=='undefined' && CAREER && CAREER.career) || null;
  return cr && ccPastYear(cr.year) ? cr.year : 2026;
}
// Годы до 2026-го, которые можно выбрать: у каждого свой календарь и свои карточки.
function ccPastYear(y){ return y===2025 || y===2024 || y===2023 || y===2022 || y===2021 || y===2020 || y===2019; }
function ccIs2025(){ return ccCalYear()===2025; }
// 2024-й — отзыв: «добавь 2024 год и рейтинги карточек этого года», «и календарь все как и прошлые».
function ccIs2024(){ return ccCalYear()===2024; }
// 2023-й — отзыв: «сделай 2023 год теперь». FNCS 2023, дуо, Chapter 4; см. CAREER_YEAR_2023.
function ccIs2023(){ return ccCalYear()===2023; }
// 2022-й — FNCS Chapter 3, дуо; см. CAREER_YEAR_2022.
function ccIs2022(){ return ccCalYear()===2022; }
// 2021-й — FNCS Chapter 2, трио, онлайн; см. CAREER_YEAR_2021.
function ccIs2021(){ return ccCalYear()===2021; }
// 2019-й — World Cup и первые FNCS, формат на вечер; см. CAREER_YEAR_2019.
function ccIs2019(){ return ccCalYear()===2019; }
// 2020-й — FNCS онлайн, формат на вечер; см. CAREER_YEAR_2020.
function ccIs2020(){ return ccCalYear()===2020; }
function ccYearFrom(){ return ccIs2020() ? CC_YEAR_2020_FROM : ccIs2019() ? CC_YEAR_2019_FROM : ccIs2021() ? CC_YEAR_2021_FROM : ccIs2022() ? CC_YEAR_2022_FROM : ccIs2023() ? CC_YEAR_2023_FROM : ccIs2024() ? CC_YEAR_2024_FROM : ccIs2025() ? CC_YEAR_2025_FROM : CC_YEAR_FROM; }
function ccYearTo(){ return ccIs2020() ? CC_YEAR_2020_TO : ccIs2019() ? CC_YEAR_2019_TO : ccIs2021() ? CC_YEAR_2021_TO : ccIs2022() ? CC_YEAR_2022_TO : ccIs2023() ? CC_YEAR_2023_TO : ccIs2024() ? CC_YEAR_2024_TO : ccIs2025() ? CC_YEAR_2025_TO : CC_YEAR_TO; }
function ccYearRows(){ return ccIs2020() ? CAREER_YEAR_2020 : ccIs2019() ? CAREER_YEAR_2019 : ccIs2021() ? CAREER_YEAR_2021 : ccIs2022() ? CAREER_YEAR_2022 : ccIs2023() ? CAREER_YEAR_2023 : ccIs2024() ? CAREER_YEAR_2024 : ccIs2025() ? CAREER_YEAR_2025 : CAREER_YEAR; }
// 2024-й: дивизионов ещё не было — кубковых недель нет вовсе. 2023-й — см. CC_CUP_WEEKS_2023.
function ccCupWeeks(){ return (ccIs2021() || ccIs2020() || ccIs2019()) ? [] : ccIs2022() ? CC_CUP_WEEKS_2022 : ccIs2023() ? CC_CUP_WEEKS_2023 : ccIs2024() ? [] : ccIs2025() ? CC_CUP_WEEKS_2025 : CC_CUP_WEEKS; }
/* Год без дивизионов. В 2024 кубков нет (ccCupWeeks пуст, на Мейджор шли через открытые квалы), и без этого
   карьера сидела в пятом дивизионе навсегда. Такой год играется без лестницы: вся сцена и настоящие напарники,
   как Дивизион 1 в остальных годах. Признак берём у календаря, а не у числа 2024: на стыке
   карьера 2024 уходит в календарь 2025, где кубки есть. */
function ccNoDivisions(){
  // 2021-й: дивизионных кубков нет (дивизионы Arena — не турнир).
  if(ccIs2021() || ccIs2020() || ccIs2019()) return true;
  /* 2022-й: дивизионы только в C3S4 (кубки осени). Создание — без ступени, как у 2024-го;
     ступень ставится в день Placement Cup (ccDiv22Place). */
  if(ccIs2022()){
    if(typeof SHOWN_SCREEN!=='undefined' && SHOWN_SCREEN==='screen-career-create') return true;
    const d=careerToday(); return d<CC_DIV_FROM_2022 || d>CC_DIV_END_2022;
  }
  /* 2023-й: дивизионы только до Мейджора 1 включительно. На экране создания — есть (ступень
     выбирается), в карьере — пока не кончился финал Мейджора 1. */
  if(ccIs2023()){
    if(typeof SHOWN_SCREEN!=='undefined' && SHOWN_SCREEN==='screen-career-create') return false;
    return careerToday()>CC_DIV_END_2023;
  }
  return !ccCupWeeks().length;
}
/* Performance Evaluation 2025-го — с архива Tracker (21 сентября 2026): раунд 1
   семь игр, топ-33 в раунд 2 того же вечера, четыре игры, $400 на игрока за
   каждую победу. Только Дивизион 1 — как и в 2026-м. */
const CC_EVAL_NIGHTS_2025=[
  '2024-12-18','2025-01-07','2025-01-14','2025-01-21','2025-01-28','2025-02-04','2025-02-11',
  '2025-02-25','2025-03-04','2025-03-11','2025-03-18','2025-03-25','2025-04-01','2025-04-08','2025-04-15','2025-04-22',
  '2025-05-09','2025-05-16','2025-05-22','2025-05-29',
  '2025-06-10','2025-06-18','2025-06-24','2025-07-15','2025-07-22','2025-07-29',
  '2025-08-08','2025-08-12','2025-08-19','2025-08-26','2025-09-02'
];
// И Reload Performance Evaluation (S34): те же правила, остров Reload.
const CC_EVAL_RELOAD_2025=['2025-03-17','2025-04-09','2025-04-10','2025-04-16','2025-04-21','2025-04-28'];
/* Оценка 2024-го шла только в Европе (в архиве Tracker страниц других регионов нет —
   404 на NAC/BR/ASIA/ME/OCE; у NAC в S31 есть лишь Reload-оценка, и та после года).
   Раунд 1 семь игр, раунд 2 четыре игры (MatchCap окон). */
const CC_EVAL_NIGHTS_2024=['2023-12-05','2023-12-12','2024-01-10','2024-01-16','2024-01-23','2024-01-31','2024-02-13','2024-02-22','2024-02-28',
  '2024-03-12','2024-03-19','2024-03-26','2024-04-02','2024-04-09','2024-04-16','2024-04-23','2024-04-30','2024-05-07','2024-05-14',
  '2024-05-28','2024-05-31','2024-06-04','2024-06-25','2024-07-23','2024-07-30','2024-08-06','2024-08-17','2024-08-27','2024-09-04'];
/* Оценка 2023-го — S25 и S26, только Европа (у других регионов в архиве её нет):
   раунд 1 → топ-50 → раунд 2 того же вечера, топ-5 по $200 на игрока. */
const CC_EVAL_NIGHTS_2023=['2023-06-12','2023-06-27','2023-08-29','2023-09-12','2023-09-26'];
function ccEvalNights(){
  if(ccIs2022() || ccIs2021() || ccIs2020() || ccIs2019()) return [];   // у 2022-го и 2021-го оценки в архиве нет
  if(ccIs2023()) return ccCareerRegion()==='EU' ? CC_EVAL_NIGHTS_2023 : [];
  return ccIs2024() ? (ccCareerRegion()==='EU' ? CC_EVAL_NIGHTS_2024 : []) : ccIs2025() ? CC_EVAL_NIGHTS_2025 : CC_EVAL_NIGHTS;
}
// Reload-оценка 2025-го снята с календаря: Reload — только в 2026-м (отзыв). Список оставлен как замер.
function ccEvalReloadNights(){ return []; }
function ccEvalIsReload(iso){ return ccEvalReloadNights().indexOf(iso||careerToday())>=0; }
// Оценка в ночь Reload — лобби Reload по 40 игроков, как везде в Reload (было 50 команд, игрок 2.11: «во всех релоад турнирах по 40?»).
function ccEvalLobby(){ return ccEvalIsReload() ? ccReloadLobby(careerSquadSize()) : ccTeams(50); }
// Победа в оценке: 2026-й — $800 на дуо; 2025-й — $400 на игрока, то есть на состав.
/* 2024-й — три эпохи по таблицам окон Tracker: до 2 апреля раунд 2 платил топ-5 по $200
   на игрока (PayoutTable rank), со 2 апреля $250 за победу, с 28 мая $400 за победу. */
function ccEvalWinCash(){
  if(ccIs2023() || ccIs2022() || ccIs2021() || ccIs2020() || ccIs2019()) return 0;   // 2023-й платил топ-5, а не за победу — см. ccEvalTop5Cash
  if(ccIs2024()){ const d=careerToday(); return (d<'2024-04-02' ? 0 : d<'2024-05-28' ? 250 : 400)*careerSquadSize(); }
  return ccIs2025() ? 400*careerSquadSize() : CC_EVAL_WIN_CASH;
}
function ccEvalTop5Cash(){ return (ccIs2023() || (ccIs2024() && careerToday()<'2024-04-02')) ? 200*careerSquadSize() : 0; }
function ccEvalR1Games(){ return (ccIs2025() || ccIs2024() || ccIs2023()) ? 7 : CC_EVAL_R1_GAMES; }
/* Год КАРТОЧЕК — не то же, что год календаря.

   Отзыв: «2025 — собирается дуо-сезон сам по себе, не
   ориентируясь на рейтинги 2026 года настоящие, а на 25». Карьера, начатая в
   2025-м, дальше живёт своим миром: в 2026-м (и дальше) сцена — те же люди
   2025-го с тем, что они наиграли в этой карьере (CAREER.dev), а не карточки
   2026-го. Календарь при этом 2026-й. Пары в дуо-год — ядра трио 2025-го,
   остальные собираются по силе (ccContinuityDuos). */
function ccNowYear(){
  // Расчёт целей потенциала (ccRealTargets) смотрит на год календаря как свежая карьера.
  if(typeof CC_NOW_YEAR_FORCE!=='undefined' && CC_NOW_YEAR_FORCE) return CC_NOW_YEAR_FORCE;
  if(typeof SHOWN_SCREEN!=='undefined' && SHOWN_SCREEN==='screen-career-create' && typeof CC!=='undefined' && CC)
    return ccPastYear(CC.year) ? CC.year : 2026;
  /* НОВАЯ ГЛАВА — НАСТОЯЩИЙ ГОД (Notion «17.10», тестер: «команды не все как в жизни в новых
     главах», «типы на европе фнкс выиграли, а у них 70 рейтинга»; его предложение — «чтобы
     полностью настоящие данные переносились в новую главу, будто ты только начал играть в этой
     главе», и ответ автора «думаю, да»). Было: сцена жила людьми года старта (cr.year0), рейтинг
     лишь подтягивался к году календаря (ccRealPull), составы года ставились только если оба
     человека дожили, остальные сводились по силе. Теперь сцена, составы и рейтинги — года
     календаря, как у свежей карьеры; прошлая глава остаётся небольшой поправкой (ccChapterCarry). */
  return ccCalYear();
}
/* Что сцена наиграла в прошлой главе — поправкой, а не вторым рейтингом: на стыке книги роста
   (CAREER.dev, CAREER.devL) сжимаются вдвое и не дальше ±3 (тестер: «у кого-то может побольше
   или немного меньше рейтинг быть, если хороший результат в прошлой главе показали, но всё равно
   чтобы рейтинг сильно не отличался»). Один раз на год: сейв, уже стоящий в новой главе, сжимается
   при загрузке. Годы после 2026-го — та же глава 2026-го, их не трогает. */
const CC_CHAPTER_CARRY=0.5, CC_CHAPTER_CAP=3;
/* Карьера уже перешла в новую главу (год календаря не год старта). Сцена у неё — года календаря,
   как у свежей (ccNowYear), но составы собираются тем же путём, что и до правки 17.10: настоящие
   составы года (ccRealTeamDuos) плюс свободные сильные в пары и тройки (ccContinuityDuos/Thirds) —
   иначе в первый день главы до трети топ-40 стояли без состава (check-career-chapter-squads). */
function ccChapterMoved(){
  const cr=(typeof CAREER!=='undefined' && CAREER && CAREER.career) || null;
  if(CC_NOW_YEAR_FORCE || !cr || !ccPastYear(cr.year0)) return false;
  if(typeof SHOWN_SCREEN!=='undefined' && SHOWN_SCREEN==='screen-career-create') return false;
  return ccCalYear()!==cr.year0;
}
function ccChapterCarry(){
  const cr=(typeof CAREER!=='undefined' && CAREER && CAREER.career) || null;
  if(!cr || cr.chapterY===cr.year) return false;
  const moved=cr.chapterY!=null || (cr.year0!=null && cr.year!==cr.year0);
  cr.chapterY=cr.year;
  if(!moved) return true;
  // Тройки и ядра, посеянные из людей года старта, — заново из сцены года (careerPools).
  delete cr.triosSeeded; delete cr.trioCores; delete cr.trioFilled;
  if(typeof CC_POOLS!=='undefined') CC_POOLS=null;
  ['dev', 'devL'].forEach(b=>{
    const book=CAREER[b];
    if(!book || typeof book!=='object') return;
    Object.keys(book).forEach(k=>{
      const v=Math.max(-CC_CHAPTER_CAP, Math.min(CC_CHAPTER_CAP, (+book[k]||0)*CC_CHAPTER_CARRY));
      if(Math.abs(v)<0.05) delete book[k]; else book[k]=Math.round(v*10)/10;
    });
  });
  return true;
}
// Второй и дальше год карьеры 2025-го (или 2024-го): календарь новее, люди свои.
function ccContinuity(){ return ccNowYear()<2026 && ccNowYear()!==ccCalYear(); }
// Сколько 2026-х годов карьера уже прожила до текущего сезона (для номеров сезонов и года на экране).
function ccYearShift(){
  const cr=(typeof CAREER!=='undefined' && CAREER && CAREER.career) || null;
  if(!cr) return 0;
  const past=(cr.season||1)-1 - (cr.year0===2025 ? 1 : cr.year0===2024 ? 2 : cr.year0===2023 ? 3 : cr.year0===2022 ? 4 : cr.year0===2021 ? 5 : cr.year0===2020 ? 6 : cr.year0===2019 ? 7 : 0);
  return Math.max(0, past);
}
// Год, который стоит писать на экране за этот сезон.
function ccSeasonYear(){ return ccIs2020() ? 2020 : ccIs2019() ? 2019 : ccIs2021() ? 2021 : ccIs2022() ? 2022 : ccIs2023() ? 2023 : ccIs2024() ? 2024 : ccIs2025() ? 2025 : 2026+ccYearShift(); }
// The Performance Evaluation, night by night rather than as a span: it is the
// one event that runs every week of the year, and a career calendar has to put
// it on the right evening. Division 1 only — its own page says so.
const CC_EVAL_NIGHTS=[
  '2025-12-04','2025-12-11','2025-12-18','2026-01-09','2026-01-15','2026-01-22',
  '2026-01-29','2026-02-05','2026-02-12','2026-02-19','2026-02-26','2026-03-05',
  '2026-03-12','2026-03-20','2026-03-26','2026-04-01','2026-04-09','2026-04-16',
  '2026-04-23','2026-05-07','2026-05-14','2026-05-21','2026-06-03','2026-06-07',
  '2026-06-11','2026-06-18','2026-07-16','2026-07-23','2026-07-30','2026-08-06',
  '2026-08-13',
  // Сорок второй сезон, с его Tracker-сейва 23 августа
  // (epicgames_S42_PerformanceEvaluation_EU): девять вечеров, два раунда в
  // каждый — раунды идут одним вечером, как и раньше.
  '2026-08-23','2026-09-03','2026-09-10','2026-09-17','2026-09-24',
  '2026-10-01','2026-10-08','2026-10-15','2026-10-22',
  // S43 (мини-сезон с 1.11): Performance Cup по четвергам, календарь Epic (S43_PerformanceEvaluationTrios_EU).
  '2026-11-05','2026-11-12','2026-11-19','2026-11-26'
];
/* Divisional cups week by week, off Epic's schedule pages
   (www.fortnite.com/competitive/events/S39_FNCSDivisionalCup_Division1/schedule?region=EU, plus S40/S41 and
   Divisions 2-5). Not a plain Mon/Tue/Sat rhythm:
   - cups stop for the Major: D1 plays nothing 3 Apr to 3 May and from 18 Jul to year end;
   - 3 of 15 finals aren't on Saturday: Sun 8 Feb, Thu 2 Apr (S40 week 2), Fri 17 Jul;
   - the pause is D1 only: 6-7 Apr and 18-19 Jul are normal weeks for D2-5, marked 'low', no Weekly Final.
   D2-5 run identical dates, one row serves them.
   [id, session 1, session 2, Weekly Final or null, 'low' if Division 1 is away] */
const CC_CUP_WEEKS=[
  ['S39_FNCSDivisionalCup','2026-02-02','2026-02-03','2026-02-08'],
  ['S39_FNCSDivisionalCup','2026-02-09','2026-02-10','2026-02-14'],
  ['S39_FNCSDivisionalCup','2026-02-16','2026-02-17','2026-02-21'],
  ['S39_FNCSDivisionalCup','2026-02-23','2026-02-24','2026-02-28'],
  ['S39_FNCSDivisionalCup','2026-03-02','2026-03-03','2026-03-07'],
  ['S39_FNCSDivisionalCup','2026-03-09','2026-03-10','2026-03-14'],
  ['S40_FNCSDivisionalCup','2026-03-23','2026-03-24','2026-03-28'],
  ['S40_FNCSDivisionalCup','2026-03-30','2026-03-31','2026-04-02'],
  ['S40_FNCSDivisionalCup','2026-04-06','2026-04-07',null,'low'],
  ['S40_FNCSDivisionalCup','2026-05-04','2026-05-05','2026-05-09'],
  ['S40_FNCSDivisionalCup','2026-05-11','2026-05-12','2026-05-16'],
  ['S40_FNCSDivisionalCup','2026-05-18','2026-05-19','2026-05-23'],
  ['S41_FNCSDivisionalCup','2026-06-08','2026-06-09','2026-06-13'],
  ['S41_FNCSDivisionalCup','2026-06-15','2026-06-16','2026-06-20'],
  ['S41_FNCSDivisionalCup','2026-06-22','2026-06-23','2026-06-27'],
  ['S41_FNCSDivisionalCup','2026-07-13','2026-07-14','2026-07-17'],
  ['S41_FNCSDivisionalCup','2026-07-18','2026-07-19',null,'low'],
  /* Сорок второй сезон, снятый с его же Tracker-сейвов 23 августа
     (epicgames_S42_FNCSDivisionalCup_Division1_EU — «FNCS Division 1
     Practice»): одна сессия в неделю вместо двух и финал в субботу, только
     Дивизион 1 — страница Epic так и называется. Финал третьей недели —
     суббота 13:00, не опечатка: так стоит окно Week3Final_EU. */
  ['S42_FNCSDivisionalCup_Division1','2026-08-25',null,'2026-08-29','d1'],
  ['S42_FNCSDivisionalCup_Division1','2026-08-31',null,'2026-09-05','d1'],
  ['S42_FNCSDivisionalCup_Division1','2026-09-07',null,'2026-09-12','d1'],
  ['S42_FNCSDivisionalCup_Division1','2026-09-14',null,'2026-09-19','d1']
];

function ccAddDays(iso, n){
  const t=new Date(iso+'T00:00:00Z');
  t.setUTCDate(t.getUTCDate()+n);
  return dateKey(t);
}
// Every day of the career year that carries something, built once and kept:
// this walks about 270 days and the hub asks for it on every render.
let CC_YEAR_DAYS=null;
/* Мир, построенный этой страницей, — выбросить.

   Пул, снимок сцены, европейский список, флаги лестницы, клубы, подписи года,
   пары и таблицы архива строятся на ПЕРВОЕ обращение и живут до конца страницы.
   Одиночной карьере это правильно: мир у неё один. Командная получает мир от
   сервера ПОСЛЕ загрузки — и если построенное не выбросить, клиент считает
   вечер по вчерашней сцене и расходится с напарником МОЛЧА: на экране у обоих
   всё выглядит нормально до самой таблицы.

   Найдено при измерении локстепа, до единой строки мультиплеера.
   Сторож — tools/check-mp-world-reset.js. */
function ccWorldReset(){
  CC_POOLS=null; CC_REC_MATES=null;
  CC_NOW_CARDS={}; CC_NOW_TAG=null; CC_ARC_PAIRS={};
  CC_EU_ALL={};
  /* И ростер региона с готовыми рейтингами (_ovr на момент сборки) и ники сцены над ним: мир сменился (книга мира,
     новый год) — собираются заново, как остальные снимки. */
  CC_EU_CARDS={}; CC_REAL_NAMES={};
  CC_NAT_POOL={};
  CC_ORG_POOL={}; CC_ORG_NAMES={}; CC_LADDER_POOL={};
  CC_YEAR_DAYS=null;
  CH_ARC_TBL={};
}
let CC_YEAR_DAYS_OF=null;
function careerYearDays(){
  const ydKey=(typeof ccVictoryListKey==='function') ? ccVictoryListKey() : ccCalYear();
  if(CC_YEAR_DAYS && CC_YEAR_DAYS_OF===ydKey) return CC_YEAR_DAYS;
  CC_YEAR_DAYS_OF=ydKey;
  const out=new Map();
  const add=(iso, kind, label, id, only)=>{
    if(iso<ccYearFrom() || iso>ccYearTo()) return;
    if(!out.has(iso)) out.set(iso, []);
    out.get(iso).push({kind, label, id, only:only||null});
  };
  // The cups first, day by day off the measured table. "Session", not "Round":
  // below Division 1 these are two separate goes at the same cut rather than two
  // rounds of one tournament, and a label that says round tells the player the
  // first one carries into the second. It does not.
  ccCupWeeks().forEach(function(w){
    const id=w[0], final=w[3], only=w[4]||null;
    add(w[1], 'cup', L().calSession.replace('{N}', '1'), id, only);
    // Неделя из одной сессии (Division 1 Practice, S42) второго вечера не имеет.
    if(w[2]) add(w[2], 'cup', L().calSession.replace('{N}', '2'), id, only);
    // Both go on the calendar; who may enter which is the hub's question.
    if(final) add(final, 'final', L().calWeeklyFinal, id);
  });
  const sessions={};
  ccYearRows().forEach(function(row){
    const from=row[0], to=row[1], id=row[2], kind=row[3], shape=row[4];
    // A session is one of several goes at the same cut, numbered in order.
    if(shape==='session'){
      sessions[id]=(sessions[id]||0)+1;
      add(from, kind, ccYearLabel(id, from, from)+' · '+L().calSession.replace('{N}', String(sessions[id])), id);
      return;
    }
    // A pair is two sessions with a gap between them: only the two dates run,
    // and the second is session two rather than "day nine".
    if(shape==='pair'){
      add(from, kind, ccYearLabel(id, from, from), id);
      if(to!==from) add(to, kind, ccYearLabel(id, ccAddDays(from,1), from), id);
      return;
    }
    // Everything else is the days it actually ran, end to end.
    for(let d=from; d<=to; d=ccAddDays(d,1)) add(d, kind, ccYearLabel(id, d, from), id);
  });
  ccEvalNights().forEach(d=>add(d, 'eval', L().calPerfEval, 'PerformanceEvaluation'));
  ccEvalReloadNights().forEach(d=>add(d, 'eval', L().calPerfEval+' · Reload', 'PerformanceEvaluationReload'));
  CC_GCLC.forEach(v=>add(v.day, 'gc',
    v.q===0 ? L().ccGcFinal : L().ccGcRound(v.q, v.round), 'GlobalChampionshipLastChance'));
  ccVictoryList().forEach(v=>add(v.day, 'victory',
    v.lan ? v.lan
          : v.name ? v.name+' '+v.n
          : (v.mode==='duo'?ccVictoryCupName():L().calVictorySolo)+' '+v.n, v.id));
  CC_YEAR_DAYS=out;
  return out;
}
/* ---- LAN cities rotate after the first year ----
   Pool is only cities that hosted a Fortnite LAN: New York (2019 WC), Raleigh 2022, Copenhagen 2023, Fort Worth
   2024, Lyon 2025, Düsseldorf and Antwerp 2026, Paris (Reload Championship), Riyadh (EWC).
   Year one is the measured 2026 calendar. After that each year draws three of the nine, seeded off the season so a
   save is stable, never repeating last year's city for the same event. */
/* The first nine are the rooms this game has really been played in — New York
   2019, Raleigh 2022, Copenhagen 2023, Fort Worth 2024, Lyon 2025, Düsseldorf
   and Antwerp 2026, Paris for the Reload Championship, Riyadh for the Esports
   World Cup. The rest are his, 17 August: a LAN does not have to go back where
   it has been, and these are cities that hold events of this size. */
const CC_LAN_HOSTS=[
  {key:'Dus', nat:'de'}, {key:'Ant', nat:'be'}, {key:'Lyo', nat:'fr'},
  {key:'Cph', nat:'dk'}, {key:'Ftw', nat:'us'}, {key:'Rdu', nat:'us'},
  {key:'Par', nat:'fr'}, {key:'Ryd', nat:'sa'}, {key:'Nyc', nat:'us'},
  {key:'Tok', nat:'jp'}, {key:'Bel', nat:'rs'}, {key:'Kat', nat:'pl'},
  {key:'Sto', nat:'se'}, {key:'Mad', nat:'es'}, {key:'Ams', nat:'nl'},
  {key:'Sao', nat:'br'}, {key:'Seo', nat:'kr'}, {key:'Tor', nat:'ca'},
  {key:'Syd', nat:'au'}, {key:'Mex', nat:'mx'}, {key:'Dub', nat:'ae'},
  {key:'Ist', nat:'tr'}, {key:'Mil', nat:'it'}, {key:'Lon', nat:'gb'},
  {key:'Sin', nat:'sg'},
  {key:'Bue', nat:'ar'}, {key:'Alm', nat:'kz'}, {key:'Scl', nat:'cl'}
];
/* ГОДЫ 2027–2030 — СТРАНЫ ТЕХ, КТО ИГРАЕТ (его слово 24.10: «пусть страны ланов будут в следующих годах
   … основываясь на онлайн стран, которые играют fncs draft»). Порядок — визиты Web Analytics fncsdraft.com
   за 25.09–24.10.2026 (люди, без ботов): RU 1940, US 1610, BR 990, UA 710, AR 560, CA 540, RS 410, JP 370,
   KZ 350, BY 290, CL 210, AU 190. Россию, Украину и Беларусь не берём: «москва киев не надо без политики».
   Год берёт следующие три: Глобалы — самой большой, Саммит — второй, чемпионат Reload — третьей.
   Девять стран — ровно 2027–2029, каждая по разу; дальше прежний жребий. */
const CC_LAN_PLAYER_NATS=['us','br','ar','ca','rs','jp','kz','cl','au'];
// How far back a country is remembered. One year was the rule when there were
// six of them and it was all six could carry; twenty-one hold two comfortably,
// so a career does not see the same flag twice in three seasons.
const CC_LAN_LOOKBACK=2;
const CC_LAN_FIRST={summit:'Dus', globals:'Ant', rc:'Par'};
// The countries there are, in the order the roster lists their cities.
function ccLanNats(){
  const out=[];
  CC_LAN_HOSTS.forEach(h=>{ if(out.indexOf(h.nat)<0) out.push(h.nat); });
  return out;
}
function ccLanShuffle(list, rnd){
  const pool=list.slice();
  for(let i=pool.length-1;i>0;i--){
    const j=Math.floor(rnd()*(i+1));
    const t=pool[i]; pool[i]=pool[j]; pool[j]=t;
  }
  return pool;
}
/* A year is settled as a year, and settled on countries.

   His rule, said again after the first version shipped: a new country every
   year, not merely a new city — Lyon after Paris is still France, and going
   back to Germany the season after Düsseldorf is going back to Germany.

   So the draw picks three of the six countries the nine rooms sit in, none of
   which held anything last year, and then a city inside each. Six countries and
   three events a year means the two halves alternate, which is what nine real
   rooms allow — and the halves do not look alike, because the United States has
   three of them and France two, so the same country is a different building.

   Memoised, so asking for season twelve does not redraw eleven years every time
   a label is rendered. */
const CC_LAN_YEARS={};
function ccLanFixed(season){
  const s=Math.max(1, season|0);
  if(s<=1) return CC_LAN_FIRST;
  if(CC_LAN_YEARS[s]) return CC_LAN_YEARS[s];
  const prev=ccLanFixed(s-1);
  const seats=['summit','globals','rc'];
  const by=(s-2)*3;
  if(by+3<=CC_LAN_PLAYER_NATS.length){
    const rnd0=careerRng(ccHashStr('lan|'+s)), out0={};
    [['globals',0],['summit',1],['rc',2]].forEach(function(p){
      const inNat=CC_LAN_HOSTS.filter(h=>h.nat===CC_LAN_PLAYER_NATS[by+p[1]]).map(h=>h.key);
      out0[p[0]]=inNat[Math.floor(rnd0()*inNat.length)] || prev[p[0]];
    });
    CC_LAN_YEARS[s]=out0;
    return out0;
  }
  const was=[];
  for(let back=1; back<=CC_LAN_LOOKBACK && s-back>=1; back++)
    seats.forEach(k=>was.push(ccLanNat(k, s-back)));
  const rnd=careerRng(ccHashStr('lan|'+s));
  const nats=ccLanShuffle(ccLanNats(), rnd);
  const pick=nats.filter(n=>was.indexOf(n)<0).slice(0, seats.length);
  // Fewer than three left is not possible with six countries and three seats,
  // and if a city is ever added or removed it fills up rather than throwing.
  nats.forEach(n=>{ if(pick.length<seats.length && pick.indexOf(n)<0) pick.push(n); });
  const out={};
  seats.forEach(function(kind, i){
    const inNat=CC_LAN_HOSTS.filter(h=>h.nat===pick[i]).map(h=>h.key);
    out[kind]=inNat[Math.floor(rnd()*inNat.length)] || prev[kind];
  });
  CC_LAN_YEARS[s]=out;
  return out;
}
function ccLanHostKey(kind, season){
  const cr=(CAREER && CAREER.career) || null;
  // Кубок наций — свой жребий по Европе, см. ccNatHostKey.
  if(kind==='nations') return ccNatHostKey(season || ((cr && cr.season) || 1));
  let s=season || ((cr && cr.season) || 1);
  /* Карьера, начатая в 2025-м: первый год — Лион (это факт, а не жребий),
     второй — 2026-й, то есть первый измеренный год со своими залами; жребий
     дальше идёт с той же точки, что у карьеры 2026-го. */
  if(cr && cr.year0===2025){
    if(s<=1) return kind==='globals' ? 'Lyo' : (CC_LAN_FIRST[kind] || CC_LAN_FIRST.summit);
    s=s-1;
  }
  if(cr && cr.year0===2024){
    if(s<=1) return kind==='globals' ? 'Ftw' : (CC_LAN_FIRST[kind] || CC_LAN_FIRST.summit);
    if(s===2) return kind==='globals' ? 'Lyo' : (CC_LAN_FIRST[kind] || CC_LAN_FIRST.summit);
    s=s-2;
  }
  // Карьера 2020-го: 2020–2021 онлайн, дальше Роли, Копенгаген, Форт-Уэрт, Лион.
  if(cr && cr.year0===2020){
    const fact=[null, 'Rdu', 'Rdu', 'Rdu', 'Cph', 'Ftw', 'Lyo'][s];
    if(fact) return kind==='globals' ? fact : (CC_LAN_FIRST[kind] || CC_LAN_FIRST.summit);
    s=s-6;
  }
  // Карьера 2019-го: Нью-Йорк (World Cup), 2020–2021 онлайн, дальше Роли, Копенгаген, Форт-Уэрт, Лион.
  if(cr && cr.year0===2019){
    const fact=[null, 'Nyc', 'Nyc', 'Nyc', 'Rdu', 'Cph', 'Ftw', 'Lyo'][s];
    if(fact) return kind==='globals' ? fact : (CC_LAN_FIRST[kind] || CC_LAN_FIRST.summit);
    s=s-7;
  }
  // Карьера 2021-го: своего ЛАНа нет (онлайн), дальше Роли, Копенгаген, Форт-Уэрт, Лион; жребий после.
  if(cr && cr.year0===2021){
    const fact=[null, 'Rdu', 'Rdu', 'Cph', 'Ftw', 'Lyo'][s];
    if(fact) return kind==='globals' ? fact : (CC_LAN_FIRST[kind] || CC_LAN_FIRST.summit);
    s=s-5;
  }
  // Карьера 2022-го: Роли, Копенгаген, Форт-Уэрт, Лион — факты; жребий дальше.
  if(cr && cr.year0===2022){
    const fact=[null, 'Rdu', 'Cph', 'Ftw', 'Lyo'][s];
    if(fact) return kind==='globals' ? fact : (CC_LAN_FIRST[kind] || CC_LAN_FIRST.summit);
    s=s-4;
  }
  // Карьера 2023-го: Копенгаген, Форт-Уэрт, Лион — факты; жребий дальше.
  if(cr && cr.year0===2023){
    if(s<=1) return kind==='globals' ? 'Cph' : (CC_LAN_FIRST[kind] || CC_LAN_FIRST.summit);
    if(s===2) return kind==='globals' ? 'Ftw' : (CC_LAN_FIRST[kind] || CC_LAN_FIRST.summit);
    if(s===3) return kind==='globals' ? 'Lyo' : (CC_LAN_FIRST[kind] || CC_LAN_FIRST.summit);
    s=s-3;
  }
  return ccLanFixed(s)[kind] || CC_LAN_FIRST[kind] || CC_LAN_FIRST.summit;
}
/* Цвета флага страны, где стоит ЛАН.

   Правка: «в календаре вместо лого, которого нет у лана».
   У кубка, финала недели, Мейджора и Релоада в календаре своя картинка
   (CAREER_EV_ART), а у Саммита, Глобалов и чемпионата Релоада её нет и быть
   не может: это не турнир с обложкой, это город. Поэтому день красится флагом
   того города — Дюссельдорф чёрно-красно-жёлтым, Антверпен чёрно-жёлто-красным,
   Париж сине-бело-красным, — и по календарю сразу видно, куда едут.

   Цвета флагов, а не фотографии: они и есть тот минимум, который читается в
   клетке размером с ноготь. */
/* Флаги рисуются по настоящим осям и долям, а не одним косым градиентом.
   Эмблемы не влезают, вместо них главное пятно (круг Кореи, полумесяц Турции,
   ромб Бразилии): точны ось, число полос и доли, эмблема примерная.
   Ключи: bands 'h' сверху вниз, 'v' слева направо; w доли полос (по умолчанию
   равные); hoist полоса у древка; cross [поле, крест]; disc [цвет, x%, y%, r%];
   bar горизонтальная полоса; stripes 13 полос с кантоном (США). */
const CC_FLAGS={
  de:{bands:'h', c:['#000000','#dd0000','#ffce00']},
  nl:{bands:'h', c:['#ae1c28','#ffffff','#21468b']},
  rs:{bands:'h', c:['#c6363c','#0c4076','#ffffff']},
  be:{bands:'v', c:['#000000','#fdda24','#ef3340']},
  fr:{bands:'v', c:['#002395','#ffffff','#ed2939']},
  it:{bands:'v', c:['#008c45','#f4f5f0','#cd212a']},
  mx:{bands:'v', c:['#006847','#ffffff','#ce1126']},
  ca:{bands:'v', c:['#ff0000','#ffffff','#ff0000'], w:[25,50,25],
      disc:[['#ff0000',50,50,13]]},
  es:{bands:'h', c:['#aa151b','#f1bf00','#aa151b'], w:[25,50,25]},
  pl:{bands:'h', c:['#ffffff','#dc143c']},
  ae:{bands:'h', c:['#00732f','#ffffff','#000000'], hoist:'#ff0000'},
  dk:{cross:['#c8102e','#ffffff']},
  se:{cross:['#006aa7','#fecc00']},
  jp:{field:'#ffffff', disc:[['#bc002d',50,50,19]]},
  kr:{field:'#ffffff', disc:[['#cd2e3a',50,43,16],['#0047a0',50,57,16]]},
  /* Полумесяц — два круга, и МЕНЬШИЙ идёт первым: слои читаются сверху вниз,
     и вырезающий круг цвета поля обязан лежать НАД белым. Стояли наоборот —
     белый перекрывал вырез, и вместо полумесяца выходило пятно. */
  tr:{field:'#e30a17', disc:[['#e30a17',45,50,14],['#ffffff',38,50,17]]},
  sg:{bands:'h', c:['#ef3340','#ffffff'], disc:[['#ef3340',29,25,10],
      ['#ffffff',22,25,12]]},
  sa:{field:'#006c35', bar:'#ffffff'},
  br:{field:'#009c3b', disc:[['#ffdf00',50,50,32],['#002776',50,50,14]]},
  au:{field:'#012169', disc:[['#ffffff',26,72,9],['#ffffff',72,34,7],
      ['#ffffff',80,60,5],['#ffffff',62,78,5]]},
  gb:{union:1},
  us:{stripes:1},
  ar:{bands:'h', c:['#74acdf','#ffffff','#74acdf'], disc:[['#f6b40e',50,50,9]]},
  kz:{field:'#00afca', disc:[['#fec50c',50,45,15]]},
  cl:{bands:'h', c:['#ffffff','#d52b1e'], disc:[['#ffffff',17,25,5],['#0039a6',17,25,13]]}
};
// Дни календаря, у которых города вместо обложки.
const CC_LAN_KINDS={summit:1, globals:1, rc:1};
/* Слои флага, верхний первым — так их и читает background-image.

   Всё считается в процентах самой клетки, поэтому ни background-size, ни
   background-position не нужны нигде, кроме звёздно-полосатого: он один
   собирается из повторяющихся полос и кантона. Круг задан эллипсом с явными
   радиусами, а не `circle`: процентный радиус у circle в CSS невалиден. */
function ccFlagLayers(f){
  const L=[];
  const disc=(c,x,y,r)=>'radial-gradient(ellipse '+r+'% '+r+'% at '+x+'% '+y+'%,'+
                        c+' 0 99%,transparent 100%)';
  (f.disc||[]).forEach(d=>L.push(disc(d[0], d[1], d[2], d[3])));
  if(f.bar) L.push('linear-gradient(to bottom,transparent 0 56%,'+f.bar+
                   ' 56% 66%,transparent 66%)');
  if(f.hoist) L.push('linear-gradient(to right,'+f.hoist+' 0 25%,transparent 25%)');
  if(f.cross){
    // Скандинавский крест смещён к древку: вертикаль стоит не по центру.
    L.push('linear-gradient(to right,transparent 0 26%,'+f.cross[1]+
           ' 26% 42%,transparent 42%)');
    L.push('linear-gradient(to bottom,transparent 0 40%,'+f.cross[1]+
           ' 40% 60%,transparent 60%)');
    L.push('linear-gradient('+f.cross[0]+','+f.cross[0]+')');
  }
  if(f.union){
    // Красный крест поверх белого, диагонали опущены — в ноготь они не читаются.
    L.push('linear-gradient(to right,transparent 0 44%,#c8102e 44% 56%,transparent 56%)');
    L.push('linear-gradient(to bottom,transparent 0 42%,#c8102e 42% 58%,transparent 58%)');
    L.push('linear-gradient(to right,transparent 0 38%,#ffffff 38% 62%,transparent 62%)');
    L.push('linear-gradient(to bottom,transparent 0 34%,#ffffff 34% 66%,transparent 66%)');
    L.push('linear-gradient(#012169,#012169)');
  }
  if(f.bands){
    const c=f.c, w=f.w || c.map(()=>100/c.length);
    const total=w.reduce((s,v)=>s+v,0);
    let at=0;
    const stops=c.map((col,i)=>{
      const from=at/total*100; at+=w[i];
      return col+' '+from.toFixed(2)+'% '+(at/total*100).toFixed(2)+'%';
    });
    L.push('linear-gradient(to '+(f.bands==='h'?'bottom':'right')+','+stops.join(',')+')');
  }
  if(f.field) L.push('linear-gradient('+f.field+','+f.field+')');
  return L;
}
// Полный набор свойств, а не одна картинка: полосам США нужен ещё и размер.
function ccLanFlagStyle(kind, season){
  const nat=ccLanNat(kind, season), f=CC_FLAGS[nat] || CC_FLAGS.de;
  /* Настоящий флаг картинкой (flags/w320, есть у всех стран ЛАНов) — нарисованный градиентами остаётся под ним
     запасным. Градиент упрощал: у Бразилии ромб стал жёлтым кругом, и день Саммита читался непонятным флагом
     (его Notion 29.10 «что это за флаг»). */
  if(/^[a-z]{2}$/.test(nat||'')){
    const under=f.stripes ? 'linear-gradient(#3c3b6e,#3c3b6e)' : ccFlagLayers(f).join(',');
    return 'background-image:url(flags/w320/'+nat+'.png),'+under+';background-size:cover;background-position:center;';
  }
  if(f.stripes){
    return 'background-image:linear-gradient(#3c3b6e,#3c3b6e),'+
           'repeating-linear-gradient(to bottom,#b22234 0 7.6923%,#ffffff 7.6923% 15.3846%);'+
           'background-size:40% 53.85%,100% 100%;'+
           'background-position:0 0,0 0;background-repeat:no-repeat,repeat;';
  }
  return 'background-image:'+ccFlagLayers(f).join(',')+';background-size:cover;';
}
function ccLanNat(kind, season){
  const k=ccLanHostKey(kind, season);
  const h=CC_LAN_HOSTS.find(x=>x.key===k);
  return h ? h.nat : 'de';
}
// The city, in the two shapes a sentence needs it in: named, and travelled to.
function ccLanCity(kind, season){
  const k=ccLanHostKey(kind, season);
  return (L().ccCity && L().ccCity[k]) || k;
}
function ccLanCityIn(kind, season){
  const k=ccLanHostKey(kind, season);
  return (L().ccCityIn && L().ccCityIn[k]) || ccLanCity(kind, season);
}
// What a day of a multi-day block is called. A three-day Heats block wants
// "Heats 2" rather than three identical rows.
function ccYearLabel(id, day, from){
  /* Строки 2025-го носят имена 2026-го: Major1_2025_PlayIn — это тот же
     «Мейджор 1 · плей-ин». Группы и лобби последнего шанса — своё, у 2026-го
     их в календаре нет (там хиты и лобби в день LCQ). */
  const m25=/^Major(\d)_2025_(PlayIn|Group([123])|LCQ|LCLobby|Final)$/.exec(id);
  if(m25){
    const names=L().ccYearNames||{};
    const majName=(names['Major'+m25[1]+'_PlayIn']||('Major '+m25[1]+' · Play-In')).split(' · ')[0];
    if(m25[3]) return majName+' · '+L().ccYr25Group(+m25[3]);
    if(m25[2]==='LCLobby') return majName+' · '+L().ccYr25Lobby;
    id='Major'+m25[1]+'_'+m25[2];
  }
  /* 2019–2020: неделя/квалификатор (раунды вечера), хиты (день), финал — по спеке сезона (CC_MX_SPEC). */
  const mx=/^Major(\d)_(2019|2020)_(?:W(\d+)R([1-4]+)|Heat([12])|Final)$/.exec(id);
  if(mx){
    const sp=(typeof ccMXSpec==='function') ? ccMXSpec(+mx[2], +mx[1]) : null, nm=sp ? sp.name : 'FNCS';
    if(mx[3]!=null) return nm+' · '+L().ccYrXWeek(+mx[3], mx[4].split('').join('–'), !!(sp && sp.qual));
    if(mx[5]) return nm+' · '+L().ccYrXHeats(+mx[5]);
    return nm+' · '+L().ccYrXFinal(!!(sp && sp.kind==='wc'));
  }
  /* 2021-й: квалификатор (раунды вечера), полуфинал (день), Reboot Round, Гранд-финал; «Мейджор 5» — Grand Royale. */
  const m21=/^Major(\d)_2021_(?:Q([123])R([1-4]+)|Semi([12])|(Reboot)|Final)$/.exec(id);
  if(m21){
    const n21=+m21[1], nm21=ccSeasonEvName(2021, n21);
    if(m21[2]) return nm21+' · '+L().ccYrXWeek(+m21[2], m21[3].split('').join('–'), true);
    if(m21[4]) return nm21+' · '+L().ccYrSemiDay(+m21[4]);
    if(m21[5]) return nm21+' · Reboot Round';
    return nm21+' · '+L().ccYrXFinal(false);
  }
  /* 2022-й: квалификатор (раунды вечера), полуфинал (сессия), Гранд-финал; Invitational — Роли. */
  const m22=/^Major(\d)_2022_(?:Q([123])R([1-4]+)|Semi([123])|Final)$/.exec(id);
  if(m22){
    const nm22=ccSeasonEvName(2022, +m22[1]);
    if(m22[2]) return nm22+' · '+L().ccYrXWeek(+m22[2], m22[3].split('').join('–'), true);
    if(m22[4]) return nm22+' · '+L().ccYrSemiDay(+m22[4]);
    return nm22+' · '+L().ccYrXFinal(false);
  }
  if(id==='Invitational2022') return L().ccYr22Inv;
  /* 2023-й: недели (день 1, день 2, финал недели), Surge Week, финал; «Мейджор 4» — Last Chance Major. */
  const m23=/^Major(\d)_2023_(?:W([123])(D1|D2|F)|(Surge)|(Final))$/.exec(id);
  if(m23){
    const n=+m23[1], d=m23[3]==='D1' ? 1 : m23[3]==='D2' ? 2 : 3;
    if(n===4) return L().ccYr23Lcm(d);
    if(m23[2]) return d===3 ? L().ccYr23WeekFinal(n, +m23[2]) : L().ccYr23Day(n, +m23[2], d);
    if(m23[4]) return L().ccYr23Surge(n);
    id='Major'+n+'_Final';
  }
  if(id==='GlobalChampionship2023') id='GlobalChampionship';
  /* 2024-й: квалификатор (раунд), полуфинал (день), финал — под именем финала 2026-го. */
  const m24=/^Major(\d)_2024_(?:Q([12])R([123])|Semi([123])|Final)$/.exec(id);
  if(m24){
    if(m24[2]){
      // Европа и NA Central: четыре раунда — суббота «2–3», воскресенье «4». См. CC_M24.qDeep.
      const deep=(typeof DEEP_MAJOR_REGIONS!=='undefined' && typeof ccCareerRegion==='function' && CAREER && CAREER.career && DEEP_MAJOR_REGIONS.has(ccCareerRegion()));
      const r=+m24[3];
      return L().ccYr24Qual(+m24[1], +m24[2], deep ? (r===2 ? '2–3' : r===3 ? '4' : '1') : r);
    }
    if(m24[4]) return L().ccYr24Semi(+m24[1], +m24[4]);
    id='Major'+m24[1]+'_Final';
  }
  if(id==='GlobalChampionship2024') id='GlobalChampionship';
  const sd=/^Showdown(\d)_2025_(LCQ|Final)$/.exec(id);
  if(sd) return L().ccYr25Showdown(+sd[1]-3, sd[2]==='LCQ' ? 1 : 2);
  const sc=/^SoloCash(\d+)_R([12])$/.exec(id);
  if(sc) return L().ccYr25SoloCash(+sc[1], +sc[2]);
  if(id==='GlobalChampionship2025') id='GlobalChampionship';
  let base=(L().ccYearNames && L().ccYearNames[id]) || id;
  // Третьего Мейджора в подписях 2026-го нет: имя берётся у первого с заменой номера.
  if(base===id){ const mm=/^Major(\d)_(\w+)$/.exec(id); const one=mm && L().ccYearNames && L().ccYearNames['Major1_'+mm[2]]; if(one) base=one.replace('1', mm[1]); }
  // The two rows that name a city name whichever city it is this year.
  const hasCity=base.indexOf('{CITY}')>=0;
  if(hasCity){
    const kind = /Reload/.test(id) ? 'rc' : /^Nations/.test(id) ? 'nations' : 'globals';
    base=base.split('{CITY}').join(ccLanCity(kind));
  }
  if(day===from) return base;
  let n=1;
  for(let d=from; d<day; d=ccAddDays(d,1)) n++;
  /* Номер дня не приклеивается к ГОРОДУ.

     Строка кончается городом ровно у двух событий года — Мирового чемпионата и
     Reload Championship, — и счётчик, приписанный к ней хвостом, читался как
     часть названия: скриншот, две плитки календаря за 26 и 27
     сентября, «Мировой чемпионат · Форт-Уэрт» и «Мировой чемпионат · Форт-Уэрт
     2». Второго Форт-Уэрта не существует, это второй день одного турнира.

     Сессия — то самое слово, которым календарь уже называет второй вечер
     кубка, и оно переведено во всех локалях. Остальные блоки (Хиты, Плей-Ин)
     города не называют, и у них хвостовой номер читается как задумано. */
  return hasCity ? base+' · '+L().calSession.replace('{N}', String(n))
                 : base+' '+n;
}

function careerEvents(){
  const div=CAREER && CAREER.career ? CAREER.career.division : 5;
  const out=new Map();
  careerYearDays().forEach((list, day)=>{
    list.forEach(e=>{
      // The Weekly Final and the Performance Evaluation belong to Division 1
      // alone. A player below it sees neither on their calendar, because neither
      // is theirs to enter — that is the division's own rule, not a display one.
      if(CC_D1_ONLY.indexOf(e.kind)>=0 && div!==1) return;
      // And the other way round: the two cup weeks Division 1 spends at the
      // Major Play-In are days it has nothing on, while the divisions below it
      // play them as an ordinary week.
      if(e.only==='low' && div===1) return;
      // И зеркально: Division 1 Practice сорок второго сезона — страница
      // самого Epic зовёт его Division 1 и никого больше.
      if(e.only==='d1' && div!==1) return;
      if(!out.has(day)) out.set(day, []);
      // id едет вместе со строкой: без него клетка календаря знает, что на ней
      // «мейджор», но не знает, КОТОРЫЙ, — а метка «ты сюда уже прошёл» стоит
      // на конкретном турнире. См. ccQualOn.
      /* Париж — ЛАН, а не картинка: его день в календаре носит флаг страны,
         как Саммит и Антверпен (ccLanFlagStyle), а не обложку своего вида.
         Отзыв: «у Парижа тоже нет логотипа Reload, можешь
         просто флаг сделать, как и остальным ЛАНам». */
      out.get(day).push({kind:e.kind, label:e.label, id:e.id,
                         lan: ccLanKindOf(e.id, e.kind),
                         // По id раньше, чем по виду: Мейджоры 2025-го — со своими постерами, 2024-го — со своим островом (ccEventArt).
                         art: ccLanKindOf(e.id, e.kind) ? null : ((typeof ccEventArt==='function' && ccEventArt(e)) || CAREER_EV_ART[e.kind] || null)});
    });
  });
  /* ПОСЛЕДНИЙ ДЕНЬ ГОДА — ЦЕРЕМОНИЯ. Правка: «церемонию сделать
     отдельный последний день, и там что-то показывают игроку за весь сезон».

     Это строка календаря, а не турнир: вида 'gala' нет в CC_PLAYABLE, поэтому
     careerCanPlayKind отвечает на него «нет», а в CC_KIND_RANK его нет — значит
     в день, где стоит настоящий турнир, он никогда не перебьёт его. Стоит он
     ровно на CC_YEAR_TO, то есть на том дне, на котором карьера и замирает
     (см. careerAdvanceBody: всё, что дальше, сажается на эту дату). */
  if(!out.has(ccYearTo())) out.set(ccYearTo(), []);
  out.get(ccYearTo()).push({kind:'gala', label:L().ccGalaDay, id:'SeasonGala',
                            lan:null, art:CAREER_EV_ART.gala});
  return out;
}

/* Какой это ЛАН — по строке года, а не по её виду: Париж идёт под видом 'gc'
   (общая с Last Chance краска), но город у него свой. */
function ccLanKindOf(id, kind){
  if(String(id||'')==='ReloadChampionshipParis') return 'rc';
  if(String(id||'')==='NationsFinal') return 'nations';   // финал — ЛАН, отбор и квалификация — онлайн
  return (kind && CC_LAN_KINDS[kind]) ? kind : null;
}
// Which month the calendar is showing. It opens on the month the player is
// actually standing in rather than on the start of the season, and the arrows
// stop at the two ends of it — there is nothing to page to outside the season.
let CH_MONTH=null;
function careerMonthBounds(){
  const a=new Date(ccYearFrom()+'T00:00:00Z'), b=new Date(ccYearTo()+'T00:00:00Z');
  return {from:{y:a.getUTCFullYear(), m:a.getUTCMonth()},
          to:  {y:b.getUTCFullYear(), m:b.getUTCMonth()}};
}
function careerMonthShift(n){
  const idx=CH_MONTH.y*12+CH_MONTH.m+n;
  const b=careerMonthBounds();
  const lo=b.from.y*12+b.from.m, hi=b.to.y*12+b.to.m;
  if(idx<lo || idx>hi) return;
  CH_MONTH={y:Math.floor(idx/12), m:idx%12};
  careerRenderHub('calendar');
}
/* ЗНАЧКИ ВИДОВ ТУРНИРА в календаре — отзыв: «измени иконки под стиль фортнайта в
   календаре, где месяц и недели». Вместо цветных точек и квадратов — глифы, как на плитках
   Compete: кубок FNCS, звезда финала, диаграмма Перфоманса, корона Мейджора, глобус, стрелки
   Reload, медаль Victory Cup, силуэт соло, микрофон Про-Ама, вершины Саммита, билет Ласт Ченса.
   Цвет остаётся тот же, что был у точки (ch-pip-*), — по нему неделю читают с расстояния. */
const CC_KIND_ICON={
  cup:'<path d="M4 2h8v2h2v3a3 3 0 0 1-3 3h-.3A3 3 0 0 1 9 11.6V13h2v1.5H5V13h2v-1.4A3 3 0 0 1 5.3 10H5a3 3 0 0 1-3-3V4h2V2zm0 3.5H3.5V7a1.5 1.5 0 0 0 1.5 1.5V5.5zm8 0V8.5A1.5 1.5 0 0 0 13.5 7V5.5H12z"/>',
  final:'<path d="M8 1.5l2 4.2 4.6.6-3.4 3.2.9 4.6L8 11.8l-4.1 2.3.9-4.6L1.4 6.3 6 5.7z"/>',
  eval:'<path d="M2 9h3v5H2zM6.5 5h3v9h-3zM11 2h3v12h-3z"/>',
  major:'<path d="M2 5l3.2 2.6L8 3l2.8 4.6L14 5l-1.3 7H3.3zM3.3 13h9.4v1.5H3.3z"/>',
  summit:'<path d="M1.5 13.5L6 5l2.4 4.2L10 6.5l4.5 7z"/>',
  globals:'<path d="M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zm-1 1.7c-.9 1-1.6 2.3-1.9 3.8H3.3a5 5 0 0 1 3.7-3.8zM3.3 9h1.8c.3 1.5 1 2.8 1.9 3.8A5 5 0 0 1 3.3 9zM8 13.1C7 12 6.5 10.6 6.4 9h3.2C9.5 10.6 9 12 8 13.1zM6.4 7C6.5 5.4 7 4 8 2.9 9 4 9.5 5.4 9.6 7zm4.7 2h1.6a5 5 0 0 1-3.5 3.8c.9-1 1.6-2.3 1.9-3.8zm0-2c-.3-1.5-1-2.8-1.9-3.8A5 5 0 0 1 12.7 7z"/>',
  gc:'<path d="M1.5 4h13v3a1.5 1.5 0 0 0 0 3v3h-13V10a1.5 1.5 0 0 0 0-3zm3.5 1.5v6h1.2v-6zm2.5 0v6h1.2v-6z"/>',
  gclc:'<path d="M1.5 4h13v3a1.5 1.5 0 0 0 0 3v3h-13V10a1.5 1.5 0 0 0 0-3zm3.5 1.5v6h1.2v-6zm2.5 0v6h1.2v-6z"/>',
  reload:'<path d="M8 2.5a5.5 5.5 0 0 1 4.9 3H15l-2.6 3.3L9.8 5.5h1.5A3.8 3.8 0 0 0 4.2 8H2.5A5.5 5.5 0 0 1 8 2.5zm-4.9 8H1l2.6-3.3 2.6 3.3H4.7A3.8 3.8 0 0 0 11.8 8h1.7a5.5 5.5 0 0 1-10.4 2.5z"/>',
  rc:'<path d="M8 2.5a5.5 5.5 0 0 1 4.9 3H15l-2.6 3.3L9.8 5.5h1.5A3.8 3.8 0 0 0 4.2 8H2.5A5.5 5.5 0 0 1 8 2.5zm-4.9 8H1l2.6-3.3 2.6 3.3H4.7A3.8 3.8 0 0 0 11.8 8h1.7a5.5 5.5 0 0 1-10.4 2.5z"/>',
  victory:'<path d="M5 1.5h6l-1.2 4.2h-3.6zM8 6.5a4 4 0 1 1 0 8 4 4 0 0 1 0-8zm0 1.6l-.8 1.7-1.8.2 1.3 1.3-.3 1.8L8 12.2l1.6.9-.3-1.8 1.3-1.3-1.8-.2z"/>',
  solo:'<path d="M8 1.5a3.2 3.2 0 1 1 0 6.4 3.2 3.2 0 0 1 0-6.4zM2.5 14.5c0-3.2 2.5-5.3 5.5-5.3s5.5 2.1 5.5 5.3z"/>',
  proam:'<path d="M8 1.5a2.5 2.5 0 0 1 2.5 2.5v4a2.5 2.5 0 0 1-5 0V4A2.5 2.5 0 0 1 8 1.5zM3.5 8h1.5a3 3 0 0 0 6 0h1.5a4.5 4.5 0 0 1-3.75 4.4V13.5h2.25V15h-6v-1.5h2.25v-1.1A4.5 4.5 0 0 1 3.5 8z"/>',
  free:'<circle cx="8" cy="8" r="3"/>'
};
function ccKindIconSVG(kind){
  const k=String(kind||'cup');
  const p=CC_KIND_ICON[k] || CC_KIND_ICON.cup;
  return '<svg viewBox="0 0 16 16" aria-hidden="true">'+p+'</svg>';
}
/* КНОПКИ КАЛЕНДАРЯ — как кнопки Fortnite: скошенные чипы, стрелки месяца и перемотки векторные, а не
   символы шрифта (скриншот: «значки не нравятся возле месяца и недели, мб дизайн изменить
   кнопочки» — это ‹ › у месяца и ⏩ у «неделя/месяц»). */
const CC_BTN_ICON={
  prev:'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M10.5 2.5L5 8l5.5 5.5 1.5-1.5-4-4 4-4z"/></svg>',
  next:'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5.5 2.5L11 8l-5.5 5.5L4 12l4-4-4-4z"/></svg>',
  ff:'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M1.5 3l6 5-6 5zM8.5 3l6 5-6 5z"/></svg>',
  skip:'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 3l7 5-7 5zM11 3h3v10h-3z"/></svg>'
};
function careerCalendarHTML(){
  const ev=careerEvents();
  const cr=CAREER.career;
  const nowFrom=careerMonday(careerToday()), nowTo=ccAddDays(nowFrom,6);

  // Open on the month the player is in, not on the first of the season.
  if(!CH_MONTH){
    const here=new Date(careerMonday(careerToday())+'T00:00:00Z');
    CH_MONTH={y:here.getUTCFullYear(), m:here.getUTCMonth()};
  }
  const b=careerMonthBounds();
  const idx=CH_MONTH.y*12+CH_MONTH.m;
  const atStart=idx<=b.from.y*12+b.from.m, atEnd=idx>=b.to.y*12+b.to.m;

  // Everything the tab shows lives inside one dark panel, so the month is a
  // screen rather than a dark rectangle dropped on a white page.
  let html=`<div class="cal-stage"><div class="cal-bar">`+
    `<button class="cal-nav" ${atStart?'disabled':''} onclick="careerMonthShift(-1)" aria-label="prev">${CC_BTN_ICON.prev}</button>`+
    `<h4>${L().calMonths[CH_MONTH.m]} ${ccShowYear(CH_MONTH.y)}</h4>`+
    `<button class="cal-nav" ${atEnd?'disabled':''} onclick="careerMonthShift(1)" aria-label="next">${CC_BTN_ICON.next}</button>`+
    `<button class="cal-today" onclick="CH_MONTH=null; careerRenderHub('calendar');">${L().calNow}</button>`+
    // The day that was picked, and the press that actually runs it. A month of
    // a career is too much to hand to one click on a screen people scroll.
    (CH_FF_ASK && CH_FF_ASK>careerToday() && !cr.seasonOver ? `<div class="cal-ask">
      <span>${L().calFfAsk(ccDayLabel(CH_FF_ASK), ccFfDays(CH_FF_ASK), ccFfEvents(CH_FF_ASK))} ${ccFfEtaText(CH_FF_ASK)}</span>
      ${ccMpOn() && ccMpFfPending() && ccMpFfPending().mine && ccMpFfPending().until===CH_FF_ASK
        ? `<span class="ch-hint" style="margin:0;">${L().ccMpFfWait(ccDayLabel(CH_FF_ASK))}</span>`
        : `<button class="ch-sign" onclick="careerFfToDay(\'${CH_FF_ASK}\')">${ccMpOn() ? L().ccMpFfYes : L().calFfGo}</button>`}
      ${/* Тот же день, но без турниров по дороге — пропуск, не перемотка.
           См. careerSkipTo; в команде день двигает сервер. */
        ccMpOn() ? '' : `<button class="ch-sign cal-skip" onclick="careerSkipTo(\'${CH_FF_ASK}\')" title="${esc(L().calSkipHint)}">${L().calSkipGo}</button>`}
      <button class="cc-back" onclick="careerFfCancel()">${L().ccDecline}</button>
    </div>` : '')+
    // The same fast-forward the main screen offers, on the screen where a
    // player is actually looking at time passing. Asked for here rather than
    // only beside Play, which is where you are when you want to move.
    (cr.seasonOver ? '' : careerFfButtonsHTML())+
    `</div><div class="cal-wrap">`;
  {
    const y=CH_MONTH.y, m=CH_MONTH.m;
    const daysIn=new Date(Date.UTC(y, m+1, 0)).getUTCDate();
    // Monday-first, which is how a European competitive week reads.
    const lead=(new Date(Date.UTC(y,m,1)).getUTCDay()+6)%7;
    let cells='';
    for(let i=0;i<lead;i++) cells+='<div class="cal-day cal-void"></div>';
    for(let d=1; d<=daysIn; d++){
      const k=dateKey(new Date(Date.UTC(y,m,d)));
      const list=ev.get(k)||[];
      const inWeek = k>=nowFrom && k<=nowTo;
      // A day wears the cover of the first thing happening on it. The Major
      // weekend is three days of the same event, so the block reads as one.
      const art=list.length ? list[0].art : null;
      const kind=list.length ? list[0].kind : null;
      /* У ЛАНа обложки нет — есть город. Флаг его страны и красит день:
         см. ccLanFlagStyle. */
      const lanKind=list.length ? list[0].lan : null;
      const lanFlag=(!art && lanKind) ? ccLanFlagStyle(lanKind) : null;
      /* A day ahead is a day you can go to.

         The calendar was the one screen in the mode that only ever told you
         things. It holds the whole year - which Saturday the Major is on, where
         the Reload final sits, how far it is to Antwerp - and the way to get
         there was pressing "a week" until the number matched. Pressing the day
         itself is the same fast-forward with the arithmetic done for you: it
         plays everything on the way, exactly as the two buttons do.

         Only forward, and only inside the season: the past is played and the
         boundary is a decision. */
      const ahead = k>careerToday() && !cr.seasonOver;
      cells+=`<div class="cal-day${list.length?' has':''}${art?' art art-'+kind:''}${lanFlag?' art art-lan':''}${inWeek?' now':''}`+
        `${ahead?' cal-go':''}${k===CH_FF_ASK?' cal-picked':''}${
          list.some(ccQualOn)?' cal-qual':''}"`+
        `${art?` style="background-image:url(${art});"`:(lanFlag?` style="${lanFlag}"`:'')}`+
        `${ahead?` onclick="careerFfAsk(\'${k}\')" title="${esc(L().calGoHere)}"`:''}>`+
        `<span class="cal-n">${d}</span>`+
        list.map(x=>`<span class="cal-ev cal-${x.kind}">${x.label}</span>`).join('')+
        // Плашка: место уже твоё (квалификация) или ЛАН зовёт тебя (приглашение).
        (list.some(ccQualOn) ? `<span class="cal-badge ok">✓ ${esc(L().lfCalQual)}</span>`
          : (k>=careerToday() && list.some(x=>x.kind==='victory' && (()=>{ const v=careerVictoryOn(k); return v && v.invite && ccVictoryInvited(v); })()))
            ? `<span class="cal-badge inv">✉ ${esc(L().lfCalInvited)}</span>` : '')+
        `</div>`;
    }
    html+=`<div class="cal-month">`+
      `<div class="cal-dow">${L().calDows.map(d=>`<span>${d}</span>`).join('')}</div>`+
      `<div class="cal-grid">${cells}</div></div>`;
  }
  return html+'</div></div>';
}

/* Career division cup. Below Division 1 the lobby is generated ladder players (labelled as such); in Division 1
   it's the real roster. All 701 EU cards in tools/baseline-card-ratings.json are 62+ (median 81): the roster is Major
   players, i.e. Division 1, so there's nobody to draw from for D2-D5.
   Format is Epic's: 11 games, lobbies of 50, PLACEMENT_POINTS_DUO, 4 per kill. Epic publishes quotas (400/200/100/50)
   but not field sizes; quotas chain, so each rung promotes a quarter to a half. One third everywhere; at 150 that's
   50, Epic's own D2 quota. See docs/superpowers/specs/2026-08-12-career-division-cups-design.md */

const CAREER_CUP_FIELD=150, CAREER_CUP_GAMES=11, CAREER_CUP_CUT=50;

/* Divisional cup size and quota per division. Epic quotas: top 400 from D5, 200 from D4, 100 from D3, 50 from D2.
   Field = 3x quota (1,200 / 600 / 300 / 150), the same one-third ratio the calibration measured.
   D1 has no quota (its 50 is a Weekly Final seat), size measured, see CC_CUP_ENTRANTS.
   CAREER_CUP_FIELD/CAREER_CUP_CUT stay for the Major Play-In, Victory Cup top 50 and Reload Opens cut. */
/* Quotas scaled to our room sizes, keeping Epic's measured shares (400/5000, 200/2500, 100/1250 = 8%, 50/725 =
   6.9%); ladder calibration depends on the shares, not the absolutes.
   Rounded to tens, shares land at 8.0/7.9/7.5/8.0, well inside room-size noise. Division 2 at 20/250 is 8% vs
   Epic's 6.9%, so it's as hard as the three below; 17 restores Epic's share.
   Division 1's 50 isn't a promotion, it's the Weekly Final's real size. */
const CC_CUP_QUOTA={1:50, 2:20, 3:30, 4:50, 5:80};
/* Division 1's is measured, not chosen, and it is not the 150 this used to say.
   That 150 was the Major's own card field — the strongest of the Play-In, the
   ones who are certainly there — and it was never Division 1's size.

   Tracker's leaderboard for S41_FNCSDivisionalCup_Division1 Week 4 Day 1 in
   Europe runs to 7 pages, the last of them 45 rows: 645 duos. Its Weekly Final
   is one page of exactly 50, which is where the quota of 50 above comes from
   and why it is the one rung whose quota is its own final rather than a
   promotion. Fifty of 645 is one in thirteen. */
/* Room sizes. tools/career-room-size.js runs the same duo through the same cup at each size with the cut at the
   same share: size doesn't matter. D4 median 11/12.8/6.8/11.1/8.2 and D2 12/12.4/12.6/12 for rooms
   100/250/500/1000/2000, promote rates 33-55% with no trend (stderr ~5 points at 100 runs).
   The only floor is cut granularity: at 8% you want 17+ seats, so Division 2's 250 is binding. Rest is
   1000/630/400/250, each rung 0.63 of the one below (D5 1.9 s a cup vs 3.7). Tracker's real 5000/2500/1250/725/645
   made the open 9,766 duos, 7+ s a stage.
   Division 1 isn't generated: every current card in the career's region, paired (206 pairs in EU).
   Quotas keep Epic's 8% (D5-3) and 6.9% (D2) shares. */
// Read off the pool rather than typed: Division 1 is the real duos there are to
// seat, which is also why it is the right size in every region. Down to a round
// ten, his call on 17 August: 206 recorded pairs seats 200 of them, and which
// six sit out is a different six every week, because careerRealDuos shuffles.
function ccDiv1Size(){
  return Math.max(50, Math.floor(careerPools().duos.length/10)*10);
}
const CC_CUP_ENTRANTS={2:250, 3:400, 4:630, 5:1000,
  get 1(){ return ccDiv1Size(); }};
/* The same room, counted in this season's teams.

   Every field and every cut in a career is written as a number of duos, because
   that is the year the mode was built on. A trio season seats the same people —
   a hundred and fifty duos and a hundred trios are both three hundred players —
   so a team count converts rather than being rewritten, and one rule does every
   one of them. Rounded, because a third of a field is not always whole; the
   simulation's own TEAM_TARGET agrees at the sizes that matter, 50 duos to 33
   trios.

   Nothing here is a balance decision. It is the same lobby, described in the
   unit the season plays in. */
/* A stage of a tournament, counted in this season's teams.

   CC_MAJOR_STAGE and CC_GCLC_ROUND are written once, at load, in duos. Rather
   than rewriting them per season this hands back a copy with the two numbers
   that are team counts converted — the games and the kill value are neither. */
function ccScaleStage(st){
  if(!st) return st;
  const out=Object.assign({}, st);
  if(out.field!=null) out.field=ccTeams(out.field);
  // cutScaled — этап, чья отсечка уже посчитана в командах сезона. Такая
  // отсечка складывается из УЖЕ пересчитанных мест (см. плей-ин Мейджора), и
  // второй пересчёт превратил бы её в две трети от самой себя.
  if(out.cut && !out.cutScaled) out.cut=ccTeams(out.cut);
  return out;
}
function ccTeams(duoCount){
  if(!(duoCount>0)) return duoCount;
  const n=careerSquadSize();
  return n===3 ? Math.round(duoCount*2/3) : n===4 ? Math.round(duoCount/2) : n===1 ? duoCount*2 : duoCount;
}
/* What this season calls a team, in the language on screen.

   The counts were converted for the trios season and the words were not, so a
   trios night said "Division 1 Cup — 11 games, 133 duos" over a lobby of trios,
   and the calendar called the Victory Cup a duos cup all year. His report,
   20 August.

   Only the career's own words go through here. The lines about the real FNCS —
   which is played in duos, and says so on the mode tiles and in the summit and
   Global Championship notes — are statements about a real tournament and are
   left alone. */
/* То же слово, что и ccSquadWord, но так, как его печатают крупные плитки —
   с заглавной. Отдельной функцией, чтобы «дуо» и «Дуо» никогда не разъехались
   по сезонам: разъехались они ровно так — счёт команд пересчитывался, слово
   стояло вшитым. */
function ccSquadWordCap(){
  const w=ccSquadWord();
  return w ? w.charAt(0).toUpperCase()+w.slice(1) : w;
}
function ccSquadWord(){
  // В день капа со своим форматом — его формат (ccVictoryFormat), а не состав года.
  let n=careerSquadSize();
  if(!CC_EVENT_SIZE && typeof ccVictoryFormat==='function' && typeof careerVictoryOn==='function'){
    const f=ccVictoryFormat(careerVictoryOn(careerToday())); if(f) n=f;
  }
  // В день Кубка наций — сборная: отбор соло, квалификация и финал — сквадом.
  if(!CC_EVENT_SIZE && typeof careerNationsOn==='function'){
    try{ const ev=careerNationsOn(careerToday()); if(ev) n=ccNatStage(ev)==='trial' ? 1 : CC_NATIONS_SQUAD; }catch(e){}
  }
  return n===1 ? L().lfWordSoloOne : n===4 ? L().lfWordSquads : n===3 ? L().ccWordTrios : L().ccWordDuos;
}
// The Victory Cup is the season's own, so its name is too.
function ccVictoryCupName(){
  const n=careerSquadSize(); return n===1 ? L().calVictorySolo : n===3 ? L().calVictoryTrio : L().calVictoryDuo;
}
function ccCupField(div){ return ccTeams(CC_CUP_ENTRANTS[div] || CAREER_CUP_FIELD); }
function ccCupCut(div){ return ccTeams(CC_CUP_QUOTA[div] || CAREER_CUP_CUT); }
function ccMajorFinalField(){ return ccTeams(50); }
function ccGlobField(){ return ccTeams(CC_GLOB_FIELD); }
function careerCupCut(div){ return ccCupCut(div); }
function careerCupSize(div){ return ccCupField(div); }

// A week draws the same field every time it is opened. Reloading the page in the
// middle of a season must not reroll who you are up against.
function careerRng(seed){
  let a=(seed>>>0)||1;
  return function(){
    a=a+0x6D2B79F5|0;
    let t=Math.imul(a^a>>>15, 1|a);
    t=t+Math.imul(t^t>>>7, 61|t)^t;
    return ((t^t>>>14)>>>0)/4294967296;
  };
}
/* Бросок недели — и соль самой карьеры.

   Без соли сезон, неделя и дивизион у всех новых карьер одинаковые, а значит
   одинаков и весь сгенерированный мир вокруг: те же четыре человека пишут в
   инбокс, те же клубы, те же имена на лестнице. Просьба от игрока: «чтоб при создании новой карьеры не одни и те же каждый раз
   предлагали дуо, а менялись первые тиммейты».

   Соль ставится один раз при создании и лежит в сейве (см. ccCareerSeed),
   поэтому внутри карьеры ничего не пляшет — неделя даёт тот же список, пока
   она та же неделя. Старый сейв соли не имеет: ему достаётся ник, и его мир
   остаётся его собственным. */
function careerSeed(cr, salt){
  /* В общей комнате гонки сид берётся от ЛОББИ, а не от карьеры: у каждого гонщика
     свой cr.seed, и на нём каждый собирал бы свой набор ботов. Сид вечера сервер
     выдаёт всем один (CC_MP_SEED), сезон, неделя и дивизион в гонке тоже совпадают
     (ccRaceShared), поэтому комната у всех выходит одна — и её не нужно пересылать:
     замер race-field-size-probe показал 162 КиБ на кубке Д1 при лимите DO в 128. */
  const own=(typeof ccRaceLock==='function' && ccRaceLock() && CC_MP_SEED)
    || (cr && cr.seed) || ccCareerSeed();
  /* НЕДЕЛЯ — ОБЫЧНО СЕГОДНЯШНЯЯ, НО НЕ ВСЕГДА ЕЁ СПРАШИВАЮТ.

     Турнир, который идёт дольше недели, обязан играться одной и той же сценой
     от первого дня до последнего. У Мейджора 2024-го два открытых
     квалификатора — 26-28 января и 2-4 февраля, — и это две календарные
     недели: бросок ложился по-новому, и во втором квалификаторе народ выходил
     с ДРУГИМИ напарниками. Отзыв: «все сильные дуо сразу друг
     друга сплитнули», и следом «два мерстача» — потому что очки серии копятся
     по ключу СОСТАВА (ccSeatKey), и человек с двумя напарниками держал в
     таблице две строки, а сетки полуфинала сажали обе.

     Париж такой правки не потребовал: три его этапа лежат в одной неделе, и
     сид там совпадал сам собой (см. ccRcField). Здесь неделю называет тот,
     кто строит комнату: `Object.assign({}, cr, {seedWeek: …})`. */
  const wk=(cr && cr.seedWeek!=null) ? cr.seedWeek : careerWeek();
  return hashStr('c'+cr.season+'w'+wk+'d'+cr.division+(salt||'')+'|'+own);
}

